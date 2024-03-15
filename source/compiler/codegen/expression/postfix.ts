import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import Function from "~/compiler/function.ts";
import { AssertUnreachable, Panic } from "~/helper.ts";
import { ResolveLinearType } from "~/compiler/codegen/expression/helper.ts";
import { OperandType } from "~/compiler/codegen/expression/type.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { IsNamespace } from "~/compiler/file.ts";
import { Instruction } from "~/wasm/index.ts";
import { LinearType } from "~/compiler/codegen/expression/type.ts";
import { Context } from "~/compiler/codegen/context.ts";



export function CompilePostfixes(ctx: Context, syntax: Syntax.Term_Expr_postfix[], type: OperandType, expect?: OperandType): OperandType {
	let res = type;
	for (const postfix of syntax) {
		const act = postfix.value[0];

		switch (act.type) {
			case "expr_call": res = CompileCall(ctx, act, res); break;
			case "expr_get": Panic(
				`${colors.red("Error")}: Unimplemented postfix operation ${act.type}\n`,
				{ path: ctx.file.path, name: ctx.file.name, ref: act.ref }
			); break;
			case "expr_param": Panic(
				`${colors.red("Error")}: Unimplemented postfix operation ${act.type}\n`,
				{ path: ctx.file.path, name: ctx.file.name, ref: act.ref }
			); break;
			default: AssertUnreachable(act);
		}
	}

	return res;
}


function CompileCall(ctx: Context, syntax: Syntax.Term_Expr_call, operand: OperandType, expect?: OperandType) {
	if (!(operand instanceof Function)) Panic(
		`${colors.red("Error")}: Cannot call on a non function value\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	operand.compile(); // check the function is compiled

	if (operand.returns.length != 1) Panic(
		`${colors.red("Error")}: Cannot currently handle functions which don't return a single value\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	if (!operand.ref) throw new Error("A function somehow compiled with no reference generated");

	// TODO: Rewrite this to allocate the return struct
	// const linear = LinearType.make(operand.returns[0], ..., ...);

	const args = LineariseArgList(syntax.value[0]);
	if (args.length != operand.arguments.length) Panic(
		`${colors.red("Error")}: Miss matched argument count\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	for (let i=0; i<args.length; i++) {
		const signature = operand.arguments[i];
		const res = CompileExpr(ctx, args[i], signature.type);
		if (IsNamespace(res)) Panic(
			`${colors.red("Error")}: Cannot use a namespace as a runtime argument\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: args[i].ref }
		);

		if (!res.like(signature.type)) Panic(
			`${colors.red("Error")}: Call argument type miss-match, expected ${signature.type.name} got ${res.getTypeName()}\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: args[i].ref }
		);


		// Special post-processing for linear types
		if (!(res instanceof LinearType)) continue;
		ResolveLinearType(ctx, res, args[i].ref);
	}

	ctx.block.push(Instruction.call(operand.ref));

	return operand.returns[0].value;
}

function LineariseArgList(args: Syntax.Term_Arg_list) {
	return args.value[0].value.map(x => x.value[0]);
}