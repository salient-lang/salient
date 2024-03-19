import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type { Term_Access, Term_Function } from "~/bnf/syntax.d.ts";
import type { File, Namespace } from "./file.ts";

import { ReferenceRange, SourceView } from "~/parser.ts";
import { IsSolidType, SolidType } from "~/compiler/codegen/expression/type.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { FuncRef } from "~/wasm/funcRef.ts";
import { Scope } from "~/compiler/codegen/scope.ts";
import { Panic } from "~/helper.ts";


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
	returns:   SolidType[];

	constructor(owner: File, ast: Term_Function) {
		this.owner = owner;
		this.name = ast.value[0].value[0].value;
		this.ast = ast;
		this.ref = null;

		this.returns   = [];
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
			this.arguments.push(new Argument(
				raw_args[i].value[0].value,
				types[i],
				raw_args[i].ref
			))
		}

		const rets = LinkTypes(this.getFile(),
			[head.value[2]]
		);
		if (rets === null) return;
		this.returns = rets;


		this.isLinked = true;
	}


	compile() {
		if (this.isCompiled) return;      // Already compiled
		if (!this.isLinked)  this.link(); // Link if not done already
		if (!this.isLinked)  return;      // Failed to link
		this.isCompiled = true;

		const project = this.getFile().owner.project;
		const func = project.module.makeFunction(
			this.arguments.map(x => x.type.getBitcode()),
			this.returns.map(x => x.getBitcode())
		);
		this.ref = func.ref;

		const scope = new Scope(func);
		const ctx = new Context(this.getFile(), scope, func.code);
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
	const out: SolidType[] = [];

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
		} else if (!IsSolidType(res)) {
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