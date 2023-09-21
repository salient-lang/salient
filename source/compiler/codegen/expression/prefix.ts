import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "../../../bnf/syntax.d.ts";
import { Intrinsic, f32, f64, i16, i32, i64, i8, u16, u32, u64, u8 } from "../../intrinsic.ts";
import { AssertUnreachable, Yeet } from "../../../helper.ts";
import { Instruction } from "../../../wasm/index.ts";
import { OperandType } from "./operand.ts";
import { Context } from "./../context.ts";


export function CompilePrefix(ctx: Context, prefix: Syntax.Term_Expr_prefix, type: OperandType, expect?: Intrinsic): Intrinsic {
	if (!(type instanceof Intrinsic)) Yeet(
		`${colors.red("Error")}: Cannot apply prefix operation to non-variable\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: prefix.ref
	});

	const op = prefix.value[0].value;
	switch (op) {
		case "!":
			Yeet(
				`${colors.red("Error")}: Unimplemented negation prefix operation\n`, {
				path: ctx.file.path, name: ctx.file.name, ref: prefix.ref
			});
			break;
		case "-":
			return CompilePrefixArithmeticInverse(ctx, type, prefix, expect);
		default: AssertUnreachable(op);
	}
}

function CompilePrefixArithmeticInverse(ctx: Context, type: Intrinsic, prefix: Syntax.Term_Expr_prefix, expect?: Intrinsic): Intrinsic {
	if (type === u8 || type === u16 || type === u32 || type === u64)
		Yeet(`${colors.red("Error")}: Cannot invert an unsigned integer\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: prefix.ref
		});

	if (type === i8 || type === i16 || type === i32) {
		ctx.block.push(Instruction.const.i32(-1));
		ctx.block.push(Instruction.i32.mul());
		return type;
	} else if (type === i64) {
		ctx.block.push(Instruction.const.i64(-1));
		ctx.block.push(Instruction.i64.mul());
		return type;
	} else if (type === f32) {
		ctx.block.push(Instruction.const.f32(-1));
		ctx.block.push(Instruction.f32.mul());
		return type;
	} else if (type === f64) {
		ctx.block.push(Instruction.const.f64(-1));
		ctx.block.push(Instruction.f64.mul());
		return type;
	}

	Yeet(`${colors.red("Error")}: Unhandled arithmetic prefix inversion for type ${type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: prefix.ref
	});
}