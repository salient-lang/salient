import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "../../../bnf/syntax.d.ts";
import { CompileConstFloat, CompileConstInt } from "./constant.ts";
import { AssertUnreachable, Yeet } from "../../../helper.ts";
import { CompilePostfixes } from "./postfix.ts";
import { CompilePrefix } from "./prefix.ts";
import { Instruction } from "../../../wasm/index.ts";
import { CompileExpr } from "./index.ts";
import { Intrinsic } from "../../intrinsic.ts";
import { Namespace } from "../../file.ts";
import { Context } from "./../context.ts";


export type OperandType = Intrinsic | Namespace;


export function CompileArg(ctx: Context, syntax: Syntax.Term_Expr_arg, expect?: Intrinsic): OperandType {
	const prefix  = syntax.value[0].value[0];
	const postfix = syntax.value[2].value;
	const val = syntax.value[1];
	let res: OperandType;
	switch (val.type) {
		case "constant":       res = CompileConstant(ctx, val, expect); break;
		case "expr_brackets":  res = CompileBrackets(ctx, val, expect); break;
		case "name":           res = CompileName(ctx, val, expect);     break;
		default: AssertUnreachable(val);
	}

	if (prefix) res = CompilePrefix(ctx, prefix, res, expect);
	if (postfix.length > 0) CompilePostfixes(ctx, postfix, res, expect);

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
	if (!variable) {
		const found = ctx.file.access(name);
		if (found === null) Yeet(`${colors.red("Error")}: Undeclared term ${name}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		return found;
	}

	if (!variable.isDefined) Yeet(`${colors.red("Error")}: Variable ${name} has no value assigned to it\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});

	ctx.block.push(Instruction.local.get(variable.register.ref));
	return variable.type;
}