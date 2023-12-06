import type * as Syntax from "~/bnf/syntax.d.ts";
import { ApplyPrecedence } from "~/compiler/codegen/expression/precedence.ts";
import { CompileInfix } from "~/compiler/codegen/expression/infix.ts";
import { CompileArg } from "~/compiler/codegen/expression/operand.ts";
import { Intrinsic } from "~/compiler/intrinsic.ts";
import { Context } from "~/compiler/codegen/context.ts";

export function CompileExpr(ctx: Context, syntax: Syntax.Term_Expr, expect?: Intrinsic) {
	const elm = ApplyPrecedence(syntax);
	if (elm.type === "expr_arg") return CompileArg(ctx, elm, expect);

	return CompileInfix(ctx, elm.lhs, elm.op, elm.rhs, elm.ref, expect);
}