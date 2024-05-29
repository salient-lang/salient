import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type { Term_Access, Term_Function } from "~/bnf/syntax.d.ts";
import type { File, Namespace } from "./file.ts";

import Structure from "~/compiler/structure.ts";
import { IntrinsicType, VirtualType, never } from "~/compiler/intrinsic.ts";
import { ReferenceRange, SourceView } from "~/parser.ts";
import { IsSolidType, SolidType } from "~/compiler/codegen/expression/type.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { FuncRef } from "~/wasm/funcRef.ts";
import { Scope } from "~/compiler/codegen/scope.ts";


export class FunctionArg {
	name: string;
	type: SolidType;
	ref: ReferenceRange;

	constructor(name: string, type: SolidType, ref: ReferenceRange) {
		this.name = name;
		this.type = type;
		this.ref  = ref;
	}
}


export default class Function {
	owner: File;
	ast: Term_Function;
	name: string;
	ref: FuncRef | null;

	external?: string;

	isCompiled: boolean;
	isLinking:  boolean;
	isLinked:   boolean;

	arguments: FunctionArg[];
	returns:   FunctionArg[] | VirtualType;

	constructor(owner: File, ast: Term_Function, external?: string) {
		this.external = external;
		this.owner = owner;
		this.name = ast.value[0].value[0].value;
		this.ast = ast;
		this.ref = null;

		this.returns   = never;
		this.arguments = [];

		this.isLinking  = false;
		this.isLinked   = false;
		this.isCompiled = false;
	}

	getFile() {
		return this.owner;
	}

	getTypeName() {
		return "function";
	}

	declarationView(): string {
		return SourceView(this.owner.path, this.owner.name, this.ast.value[0].ref);
	}

	merge(other: Namespace) {
		console.error(
			(other instanceof Function
				? `${colors.red("Error")}: Function overloads are not supported\n`
				: `${colors.red("Error")}: Cannot share a name space between these two\n`)
			+ this.declarationView()
			+ other.declarationView()
		);

		this.owner.markFailure();
	}

	link() {
		if (this.isLinked) return;

		const head = this.ast.value[0];

		const arg_group = head.value[1].value[0].value[0];
		const raw_args = arg_group ? [
			arg_group.value[0],
			...arg_group.value[1].value.map(x => x.value[0])
		] : [] ;

		const types = LinkTypes(this.getFile(), raw_args.map(x => x.value[1]));
		if (types === null) return;

		for (let i=0; i<raw_args.length; i++) {
			const type = types[i];
			if (type instanceof VirtualType) {
				const file = this.getFile();
				console.error(
					`${colors.red("Error")}: Function parameters must be a solid type\n`
					+ SourceView(file.path, file.name, raw_args[i].ref)
				)
				file.markFailure();
				continue;
			}

			this.arguments.push(new FunctionArg(
				raw_args[i].value[0].value,
				type,
				raw_args[i].ref
			));
		}

		const returnTypes = LinkTypes(this.getFile(),
			[head.value[2]]
		);
		if (returnTypes === null) return;

		const retType = returnTypes[0];
		if (retType instanceof VirtualType) {
			this.returns = retType;
		} else {
			this.returns = [
				new FunctionArg(
					"return",
					retType,
					head.value[2].ref
				)
			];
		}

		this.isLinked = true;
	}


	compile() {
		if (this.isCompiled) return;      // Already compiled
		if (!this.isLinked)  this.link(); // Link if not done already
		if (!this.isLinked)  return;      // Failed to link
		this.isCompiled = true;


		const args: number[] = [];
		const rets: number[] = [];
		if (Array.isArray(this.returns)) for (const arg of this.returns) {
			if (!(arg.type instanceof IntrinsicType)) args.push(arg.type.getBitcode());
			else rets.push(arg.type.getBitcode());
		}

		for (const arg of this.arguments) {
			args.push(arg.type.getBitcode());
		}

		const project = this.getFile().owner.project;

		const body = this.ast.value[1];
		if (this.external) {
			const file = this.getFile();
			if (body.type !== "literal") {
				console.error(`${colors.red("Error")}: External imports must have no body\n`+
					SourceView(file.path, file.name, body.ref)
				);
				file.markFailure();
				return;
			}

			const mod = file.owner.project.module;
			const typeIdx = mod.makeType(args, rets);
			const ref = mod.importFunction(this.external, this.name, typeIdx);
			if (ref === null) {
				console.error(`${colors.red("Error")}: Import name conflict\n`+
					SourceView(file.path, file.name, this.ast.ref)
				);
				file.markFailure();
				return;
			}

			this.ref = ref;

			return;
		}


		const func = project.module.makeFunction( args, rets );
		this.ref = func.ref;

		const scope = new Scope(func);
		const ctx = new Context(
			this.getFile(), scope, func.code,
			Array.isArray(this.returns) ? this.returns.map(x => x.type) : this.returns
		);

		if (Array.isArray(this.returns)) for (const ret of this.returns) {
			if (ret.type instanceof Structure) scope.registerArgument(ctx, ret.name, ret.type, ret.ref);
		}

		for (const arg of this.arguments) {
			scope.registerArgument(ctx, arg.name, arg.type, arg.ref)
		}

		if (body.type === "literal") {
			console.error(`${colors.red("Error")}: Missing function body\n`+
				SourceView(ctx.file.path, ctx.file.name, body.ref)
			);
			ctx.file.markFailure();
			return;
		}

		ctx.compile(body.value[0].value);
		scope.stack.resolve();

		if (!ctx.exited) {
			console.error(`${colors.red("Error")}: Function ${colors.brightBlue(this.name)} does not return\n`+
				SourceView(ctx.file.path, ctx.file.name, body.ref)
			);
			ctx.file.markFailure();
		}
	}
}




function LinkTypes(scope: File, syntax: Term_Access[]) {
	const out: Array<SolidType | VirtualType> = [];

	let failed = false;
	for (const arg of syntax) {
		const res = scope.get(arg);

		// Not Panicking on error
		//   Because we may want to display multiple failures at once
		if (res === null) {
			console.error(
				`${colors.red("Error")}: Cannot find namespace\n`
				+ SourceView(scope.path, scope.name, arg.ref)
			)
			failed = true;
			continue;
		} else if (!IsSolidType(res) && !(res instanceof VirtualType)) {
			console.error(
				`${colors.red("Error")}: Function parameters must be a solid type\n`
				+ SourceView(scope.path, scope.name, arg.ref)
			)
			failed = true;
			continue;
		}

		out.push(res);
	}

	if (failed) return null;
	return out;
}