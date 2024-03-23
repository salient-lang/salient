import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type { Term_Access, Term_Function } from "~/bnf/syntax.d.ts";
import type { File, Namespace } from "./file.ts";

import { ReferenceRange, SourceView } from "~/parser.ts";
import { IsSolidType, SolidType } from "~/compiler/codegen/expression/type.ts";
import { IntrinsicType, VirtualType, never, none } from "~/compiler/intrinsic.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { FuncRef } from "~/wasm/funcRef.ts";
import { Scope } from "~/compiler/codegen/scope.ts";
import { Panic } from "~/helper.ts";
import Structure from "~/compiler/structure.ts";


class Argument {
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

	isCompiled: boolean;
	isLinking:  boolean;
	isLinked:   boolean;

	arguments: Argument[];
	returns:   Argument[] | VirtualType;

	constructor(owner: File, ast: Term_Function) {
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

			this.arguments.push(new Argument(
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
				new Argument(
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
		const func = project.module.makeFunction( args, rets );
		this.ref = func.ref;




		const scope = new Scope(func);
		const ctx = new Context(this.getFile(), this, scope, func.code);

		if (Array.isArray(this.returns)) for (const ret of this.returns) {
			if (ret.type instanceof Structure) scope.registerArgument(ctx, ret.name, ret.type, ret.ref);
		}

		for (const arg of this.arguments) {
			scope.registerArgument(ctx, arg.name, arg.type, arg.ref)
		}

		const body = this.ast.value[1];
		if (body.type === "literal") throw new Error("Missing function body");

		ctx.compile(body.value[0].value);
		scope.stack.resolve();

		if (!ctx.done) Panic(`${colors.red("Error")}: Function ${colors.brightBlue(this.name)} does not return\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: body.ref
		})
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