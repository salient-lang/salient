import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "../../../bnf/syntax.d.ts";
import { CompileConstFloat, CompileConstInt } from "./constant.ts";
import { AssertUnreachable, Yeet } from "../../../helper.ts";
import { Instruction } from "../../../wasm/index.ts";
import { Intrinsic } from "../../intrinsic.ts";
import { Context } from "./../context.ts";
import { CompilePrefixArithmeticInverse } from "./prefix.ts";

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
		case "constant":       res = CompileConstant(ctx, val, expect); break;
		case "expr_brackets":  res = CompileBrackets(ctx, val, expect); break;
		case "name":           res = CompileName(ctx, val, expect);     break;
		default: AssertUnreachable(val);
	}

	if (postfix.length > 0) throw new Error("Unimplemented postfix operations");
	if (prefix) return CompilePrefix(ctx, prefix, res, expect);

	return res;
}



function CompileConstant(ctx: Context, syntax: Syntax.Term_Constant, expect?: Intrinsic) {
	const val = syntax.value[0];
	switch (val.type) {
		case "boolean": throw new Error("Unimplemented boolean constant");
		case "float":   return CompileConstFloat(ctx, val, expect);
		case "integer": return CompileConstInt(ctx, val, expect);
		case "string":  throw new Error("Unimplemented string constant");
		default: AssertUnreachable(val);
	}
}

function CompileBrackets(ctx: Context, syntax: Syntax.Term_Expr_brackets, expect?: Intrinsic) {
	return CompileExpr(ctx, syntax.value[0], expect);
}

function CompileName(ctx: Context, syntax: Syntax.Term_Name, expect?: Intrinsic) {
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


function CompilePrefix(ctx: Context, prefix: Syntax.Term_Expr_prefix, type: Intrinsic, expect?: Intrinsic): Intrinsic {

	const op = prefix.value[0].value;
	switch (op) {
		case "!":
			Yeet(`${colors.red("Error")}: Unimplemented negation prefix operation\n`, {
				path: ctx.file.path, name: ctx.file.name, ref: prefix.ref
			});
			break;
		case "-":
			return CompilePrefixArithmeticInverse(ctx, type, prefix, expect);
		default: AssertUnreachable(op);
	}
}