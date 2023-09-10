import { SourceView, type Syntax } from "../../parser.js";
import type { Scope } from "./scope.js";
import type { File } from "../file.js";

import { Instruction, AnyInstruction } from "../../wasm/index.js";
import { AssertUnreachable } from "../../bnf/shared.js";
import { Intrinsic } from "../intrinsic.js";
import { Context } from "./context.js";
import chalk from "chalk";

export function CompileExpr(ctx: Context, syntax: Syntax.Term_Expr) {
	CompileArg(ctx, syntax.value[0]);
}


function CompileArg(ctx: Context, syntax: Syntax.Term_Expr_arg) {
	const prefix = syntax.value[0].value[0];
	const val = syntax.value[1];
	switch (val.type) {
		case "constant":       CompileConstant(ctx, val, prefix); break;
		case "expr_brackets":  throw new Error("1Unimplemented"); break;
		case "expr_val":       throw new Error("2Unimplemented"); break;
		default: AssertUnreachable(val);
	}
}

function CompileConstant(ctx: Context, syntax: Syntax.Term_Constant, prefix?: Syntax.Term_Expr_prefix) {
	const val = syntax.value[0];
	switch (val.type) {
		case "boolean": throw new Error("4Unimplemented"); break;
		case "float":   throw new Error("5Unimplemented"); break;
		case "integer": CompileConstInt(ctx, val, prefix); break;
		case "string":  throw new Error("6Unimplemented"); break;
		default: AssertUnreachable(val);
	}
}


function CompileConstInt(ctx: Context, syntax: Syntax.Term_Integer, prefix?: Syntax.Term_Expr_prefix) {
	// if (prefix) throw new Error("3Unimplemented");
	let num = Number(syntax.value[0].value);

	if (isNaN(num)) {
		console.error(
			`${chalk.red("Error")}: Invalid number ${syntax.value[0].value}\n`
			+ SourceView(ctx.file.path, ctx.file.name, syntax.ref)
		)
		process.exit(1);
	}

	if (prefix) {
		const op = prefix.value[0].value;
		switch (op) {
			case "!":
				console.error(
					`${chalk.red("Error")}: Cannot negate an integer\n`
					+ SourceView(ctx.file.path, ctx.file.name, syntax.ref)
				)
				process.exit(1);
			case "-":
				num *= -1;
				break;
			default: AssertUnreachable(op);
		}
	}

	ctx.block.push(Instruction.const.i32(num));
}