import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type { Term_Block } from "~/bnf/syntax.d.ts";
import type { File } from "./file.ts";

import { FunctionArg } from "~/compiler/function.ts";
import { SourceView } from "~/parser.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { FuncRef } from "~/wasm/funcRef.ts";
import { Scope } from "~/compiler/codegen/scope.ts";
import { bool } from "~/compiler/intrinsic.ts";



export default class TestCase {
	file: File;
	ast: Term_Block;
	name: string;
	ref: FuncRef | null;

	isCompiled: boolean;
	returns: FunctionArg[];

	constructor(owner: File, name: string, ast: Term_Block) {
		this.file = owner;
		this.name = name;
		this.ast = ast;
		this.ref = null;

		this.isCompiled = false;
		this.returns = [
			new FunctionArg(
				"return",
				bool,
				ast.ref
			)
		];
	}

	declarationView(): string {
		return SourceView(this.file.path, this.file.name, this.ast.ref);
	}


	compile() {
		if (this.isCompiled) return;      // Already compiled
		this.isCompiled = true;

		const project = this.file.owner.project;

		const func = project.module.makeFunction( [], [ bool.bitcode ] );
		this.ref = func.ref;

		const scope = new Scope(func);
		const ctx = new Context(this.file, scope, func.code, [ bool ]);

		ctx.compile(this.ast.value[0].value);
		scope.stack.resolve();

		if (!ctx.exited) {
			console.error(`${colors.red("Error")}: Function ${colors.brightBlue(this.name)} does not return\n`+
				SourceView(ctx.file.path, ctx.file.name, this.ast.ref)
			);
			ctx.file.markFailure();
		}
	}

	evict() {
		if (!this.ref) return;

		const project = this.file.owner.project;
		project.module.removeFunction(this.ref);
	}
}