import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "../../../bnf/syntax.d.ts";
import Function from "../../function.ts";
import { AssertUnreachable, Yeet } from "../../../helper.ts";
import { Instruction } from "../../../wasm/index.ts";
import { OperandType } from "./operand.ts";
import { CompileArg } from "./operand.ts";
import { Context } from "./../context.ts";
import { CompileExpr } from "./index.ts";


export function CompilePostfixes(ctx: Context, syntax: Syntax.Term_Expr_postfix[], type: OperandType, expect?: OperandType): OperandType {
	let res = type;
	for (const postfix of syntax) {
		const act = postfix.value[0];

		switch (act.type) {
			case "expr_call": res = CompileCall(ctx, act, res); break;
			case "expr_get": Yeet(
				`${colors.red("Error")}: Unimplemented postfix operation ${act.type}\n`,
				{ path: ctx.file.path, name: ctx.file.name, ref: act.ref }
			); break;
			case "expr_param": Yeet(
				`${colors.red("Error")}: Unimplemented postfix operation ${act.type}\n`,
				{ path: ctx.file.path, name: ctx.file.name, ref: act.ref }
			); break;
			default: AssertUnreachable(act);
		}
	}

	return res;
}


function CompileCall(ctx: Context, syntax: Syntax.Term_Expr_call, operand: OperandType, expect?: OperandType) {
	if (!(operand instanceof Function)) Yeet(
		`${colors.red("Error")}: Cannot call on a non function value\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	operand.compile(); // check the function is compiled

	if (operand.returns.length != 1) Yeet(
		`${colors.red("Error")}: Cannot currently handle functions which don't return a single value\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	if (!operand.ref) throw new Error("A function somehow compiled with a reference generated");

	const args = LineariseArgList(syntax.value[0]);
	if (args.length != operand.arguments.length) Yeet(
		`${colors.red("Error")}: Miss matched argument count\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	for (let i=0; i<args.length; i++) {
		const signature = operand.arguments[i];
		const res = CompileExpr(ctx, args[i], signature.type);

		if (res !== signature.type) Yeet(
			`${colors.red("Error")}: Call argument type miss-match, expected ${signature.type.name} got ${res.name}\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: args[i].ref }
		);
	}

	ctx.block.push(Instruction.call(operand.ref));

	return operand.returns[0];
}





function LineariseArgList(args: Syntax.Term_Arg_list) {
	return args.value[0].value.map(x => x.value[0]);
}