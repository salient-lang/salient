import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import { AssertUnreachable } from "~/helper.ts";
import { CompileCall } from "~/compiler/codegen/expression/postfix/call.ts";
import { OperandType } from "~/compiler/codegen/expression/type.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Panic } from "~/compiler/helper.ts";



export function CompilePostfixes(ctx: Context, syntax: Syntax.Term_Expr_postfix[], type: OperandType, tailCall = false): OperandType {
	let res = type;

	for (let i=0; i<syntax.length; i++) {
		const postfix = syntax[i];
		const last = i === syntax.length - 1;
		const act = postfix.value[0];

		const shouldTail = last && tailCall;
		switch (act.type) {
			case "expr_call": res = CompileCall(ctx, act, res, shouldTail); break;

			case "expr_get": case "expr_param":
				Panic(
					`${colors.red("Error")}: Unimplemented postfix operation ${act.type}\n`,
					{ path: ctx.file.path, name: ctx.file.name, ref: act.ref }
				); break;
			default: AssertUnreachable(act);
		}
	}

	return res;
}


export function* LineariseArgList(args?: Syntax.Term_Arg_list): Generator<Syntax.Term_Expr> {
	if (args === undefined) return;

	yield args.value[0];

	for (const child of args.value[1].value) {
		yield child.value[0];
	}

	return;
}