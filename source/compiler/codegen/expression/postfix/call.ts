import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import Function from "~/compiler/function.ts";
import { IntrinsicType, IntrinsicValue, VirtualType, i32, never } from "~/compiler/intrinsic.ts";
import { OperandType, LinearType } from "~/compiler/codegen/expression/type.ts";
import { ResolveLinearType } from "~/compiler/codegen/expression/helper.ts";
import { LineariseArgList } from "~/compiler/codegen/expression/postfix/index.ts";
import { ReferenceRange } from "~/parser.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { IsNamespace } from "~/compiler/file.ts";
import { Instruction } from "~/wasm/index.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Panic } from "~/compiler/helper.ts";


export function CompileCall(ctx: Context, syntax: Syntax.Term_Expr_call, operand: OperandType, tailCall: boolean = false) {
	if (tailCall) return CompileTailCall(ctx, syntax, operand);

	if (!(operand instanceof Function)) Panic(
		`${colors.red("Error")}: Cannot call on a non function value\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	operand.compile(); // check the function is compiled

	if (!operand.ref) throw new Error("A function somehow compiled with no reference generated");

	const returnType = PrepareReturn(ctx, operand, syntax.ref);
	PrepareArguments(ctx, operand, syntax.value[0].value[0], false, syntax.ref);

	const stackReg = ctx.file.owner.project.stackReg.ref;

	// Shift the stack pointer forward
	const stackBk = ctx.scope.register.allocate(i32.bitcode);
	ctx.block.push(Instruction.global.get(stackReg));
	ctx.block.push(Instruction.local.tee(stackBk.ref));
	ctx.block.push(Instruction.const.i32(ctx.scope.stack.latentSize));
	ctx.block.push(Instruction.i32.add());
	ctx.block.push(Instruction.global.set(stackReg));

	ctx.block.push(Instruction.call(operand.ref));

	// Restore stack pointer
	ctx.block.push(Instruction.local.get(stackBk.ref));
	ctx.block.push(Instruction.global.set(stackReg));
	stackBk.free();

	return returnType;
}

function PrepareReturn(ctx: Context, target: Function, ref: ReferenceRange): VirtualType | IntrinsicValue | LinearType {
	const stackReg = ctx.file.owner.project.stackReg.ref;

	if (target.returns instanceof VirtualType) {
		return target.returns;
	}

	if (target.returns.length != 1) Panic(
		`${colors.red("Error")}: Multi-return is currently unsupported\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref }
	);

	const primary = target.returns[0];
	if (primary.type instanceof IntrinsicType) {
		return primary.type.value;
	} else {
		const alloc = ctx.scope.stack.allocate(primary.type.size, primary.type.align);
		const forward = primary.type instanceof IntrinsicType
			? primary.type.value
			: primary.type;
		const returnType = LinearType.make(forward, alloc, ctx.file.owner.project.stackBase);
		returnType.markDefined();

		ctx.block.push(Instruction.global.get(stackReg));
		ctx.block.push(Instruction.const.i32(alloc.getOffset()));

		return returnType;
	}
}

function PrepareArguments(ctx: Context, target: Function, args: Syntax.Term_Arg_list | undefined, tailCall: boolean, ref: ReferenceRange) {

	let i = 0;
	for (const arg of LineariseArgList(args)) {
		if (target.arguments.length <= i) Panic(
			`${colors.red("Error")}: Too many arguments supplied\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref }
		);

		const signature = target.arguments[i];
		i++;

		const res = CompileExpr(ctx, arg, signature.type);
		if (IsNamespace(res)) {
			ctx.markFailure(`${colors.red("Error")}: Cannot use a namespace as an argument\n`, arg.ref);
			continue;
		}

		if (!res.like(signature.type)) ctx.markFailure(
			`${colors.red("Error")}: Call argument type miss-match, expected ${colors.cyan(signature.type.name)} got ${colors.cyan(res.getTypeName())}\n`,
			arg.ref
		);

		// Special post-processing for linear types
		if (!(res instanceof LinearType)) continue;

		const final = ResolveLinearType(ctx, res, arg.ref, true);
		if (tailCall && !(final instanceof IntrinsicValue) && res.alloc !== null) ctx.markFailure(
			`${colors.red("Error")}: Cannot use a locally created value as a tail call argument\n`,
			arg.ref
		);
	}

	if (i != target.arguments.length) ctx.markFailure(
		`${colors.red("Error")}: Miss matched argument count\n`,
		ref
	);
}





export function CompileTailCall(ctx: Context, syntax: Syntax.Term_Expr_call, operand: OperandType) {
	if (!(operand instanceof Function)) Panic(
		`${colors.red("Error")}: Cannot call on a non function value\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	operand.compile(); // check the function is compiled

	if (!operand.ref) throw new Error("A function somehow compiled with no reference generated");

	const expect = Array.isArray(ctx.function.returns) ? ctx.function.returns[0].type : ctx.function.returns;
	const returnType = PrepareReturnTail(ctx, operand, syntax.ref);
	if (returnType != expect) ctx.markFailure(
		`${colors.red("Error")}: Return type miss-match, expected ${colors.cyan(expect.getTypeName())} got ${colors.cyan(returnType.getTypeName())}\n`,
		syntax.ref
	);

	PrepareArguments(ctx, operand, syntax.value[0].value[0], true, syntax.ref);

	ctx.scope.cleanup(true);

	if (ctx.function.owner.owner.project.flags.tailCall) {
		ctx.block.push(Instruction.return_call(operand.ref));
	} else {
		ctx.block.push(Instruction.call(operand.ref));
		ctx.block.push(Instruction.return());
	}

	if (returnType instanceof LinearType) returnType.dispose();
	ctx.done = true;
	return never;
}

function PrepareReturnTail(ctx: Context, target: Function, ref: ReferenceRange) {
	if (target.returns instanceof VirtualType) {
		return target.returns;
	}

	if (target.returns.length != 1) Panic(
		`${colors.red("Error")}: Multi-return is currently unsupported\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref }
	);

	const primary = target.returns[0];
	if (primary.type instanceof IntrinsicType) {
		return primary.type;
	} else {
		const out = ctx.scope.getVariable("return", false);
		if (!out) throw new Error("Return variable somehow wasn't declared");

		ResolveLinearType(ctx, out.type, ref);
	}

	return primary.type;
}