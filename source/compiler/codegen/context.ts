import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "../../bnf/syntax.d.ts";
import type { File, Namespace } from "../file.ts";
import type { Scope } from "./scope.ts";
import { Instruction, AnyInstruction } from "../../wasm/index.ts";
import { AssertUnreachable } from "../../bnf/shared.js";
import { CompileExpr } from "./expression.ts";
import { SourceView } from "../../parser.ts";
import { Intrinsic } from "../intrinsic.ts";

export class Context {
	file: File;
	scope: Scope;
	hasReturned: boolean;

	block: AnyInstruction[];

	constructor(file: File, scope: Scope, block: AnyInstruction[]) {
		this.scope = scope;
		this.block = block;
		this.file  = file;

		this.hasReturned = false;
	}

	compile(syntax: Syntax.Term_Func_stmt[]) {
		for (const stmt of syntax) {
			const line = stmt.value[0];

			switch (line.type) {
				case "declare":   CompileDeclare (this, line); break;
				case "statement": CompileExprStmt(this, line); break;
				case "return":    CompileReturn  (this, line); break;
				default: AssertUnreachable(line);
			}
		}
	}
}


function CompileDeclare(ctx: Context, syntax: Syntax.Term_Declare) {
	const name  = syntax.value[0].value[0].value;
	const type  = syntax.value[1].value[0];
	const value = syntax.value[2];

	let typeRef: Namespace | null = null;
	if (type) {
		typeRef = ctx.file.get(type.value[0]);

		if (typeRef === null || !(typeRef instanceof Intrinsic)) {
			console.error(
				`${colors.red("Error")}: Cannot find type\n`
				+ SourceView(ctx.file.path, ctx.file.name, type.ref)
			)
			Deno.exit(1);
		}
	}

	const resolveType: Intrinsic = CompileExpr(ctx, value, typeRef || undefined);
	if (!typeRef && !resolveType) {
		console.error(
			`${colors.red("Error")}: Unable to determine type\n`
			+ SourceView(ctx.file.path, ctx.file.name, syntax.ref)
		)
		Deno.exit(1);
	}

	if (typeRef && resolveType !== typeRef) {
		console.error(
			`${colors.red("Error")}: type ${resolveType.name} != type ${typeRef.name}\n`
			+ SourceView(ctx.file.path, ctx.file.name, type?.ref || syntax.ref)
		)
		Deno.exit(1);
	}

	let reg = ctx.scope.registerVariable(name, typeRef || resolveType, syntax.ref);
	if (!reg) {
		console.error(
			`${colors.red("Error")}: Variable ${name} is already declared\n`
			+ SourceView(ctx.file.path, ctx.file.name, syntax.ref)
		)
		Deno.exit(1);
	}

	ctx.block.push(Instruction.local.set(reg.register.ref));
}


function CompileExprStmt(ctx: Context, syntax: Syntax.Term_Statement) {
	CompileExpr(ctx, syntax.value[0]);
	ctx.block.push(Instruction.drop());
}


function CompileReturn(ctx: Context, syntax: Syntax.Term_Return) {
	const value = syntax.value[0];

	CompileExpr(ctx, value);
	ctx.block.push(Instruction.return());
}