import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "../../../bnf/syntax.d.ts";
import { CompileConstFloat, CompileConstInt } from "./constant.ts";
import { AssertUnreachable, Yeet } from "../../../helper.ts";
import { Instruction } from "../../../wasm/index.ts";
import { Intrinsic } from "../../intrinsic.ts";
import { Context } from "./../context.ts";

export function CompileExpr(ctx: Context, syntax: Syntax.Term_Expr, expect?: Intrinsic) {
	const op = CompileArg(ctx, syntax.value[0], expect);
	return op;
}


function CompileArg(ctx: Context, syntax: Syntax.Term_Expr_arg, expect?: Intrinsic) {
	const prefix  = syntax.value[0].value[0];
	const postfix = syntax.value[2].value;
	const val = syntax.value[1];
	let res: Intrinsic;
	switch (val.type) {
		case "constant":       res = CompileConstant(ctx, val, prefix, expect); break;
		case "expr_brackets":  res = CompileBrackets(ctx, val, prefix, expect); break;
		case "name":           res = CompileName(ctx, val, prefix, expect);     break;
		default: AssertUnreachable(val);
	}

	if (postfix.length > 0) throw new Error("Unimplemented postfix operations");

	return res;
}

function CompileConstant(ctx: Context, syntax: Syntax.Term_Constant, prefix?: Syntax.Term_Expr_prefix, expect?: Intrinsic) {
	const val = syntax.value[0];
	switch (val.type) {
		case "boolean": throw new Error("Unimplemented boolean constant");
		case "float":   return CompileConstFloat(ctx, val, prefix, expect);
		case "integer": return CompileConstInt(ctx, val, prefix, expect);
		case "string":  throw new Error("Unimplemented string constant");
		default: AssertUnreachable(val);
	}
}

function CompileBrackets(ctx: Context, syntax: Syntax.Term_Expr_brackets, prefix?: Syntax.Term_Expr_prefix, expect?: Intrinsic) {
	return CompileExpr(ctx, syntax.value[0], expect);
}

function CompileName(ctx: Context, syntax: Syntax.Term_Name, prefix?: Syntax.Term_Expr_prefix, expect?: Intrinsic) {
	const name = syntax.value[0].value;
	const variable = ctx.scope.getVariable(name);
	if (!variable) Yeet(`${colors.red("Error")}: Undeclared variable name ${name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});

	if (!variable.isDefined) Yeet(`${colors.red("Error")}: Variable ${name} has no value assigned to it\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});

	ctx.block.push(Instruction.local.get(variable.register.ref));
	return variable.type;
}