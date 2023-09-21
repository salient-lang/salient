import type * as Syntax from "../../../bnf/syntax.d.ts";
import { ApplyPrecedence } from "./precedence.ts";
import { CompileInfix } from "./infix.ts";
import { CompileArg } from "./operand.ts";
import { Intrinsic } from "../../intrinsic.ts";
import { Context } from "./../context.ts";

export function CompileExpr(ctx: Context, syntax: Syntax.Term_Expr, expect?: Intrinsic) {
	const elm = ApplyPrecedence(syntax);
	if (elm.type === "expr_arg") return CompileArg(ctx, elm, expect);

	return CompileInfix(ctx, elm.lhs, elm.op, elm.rhs, elm.ref, expect);
}