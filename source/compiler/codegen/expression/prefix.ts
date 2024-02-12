import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import { Intrinsic, f32, f64, i16, i32, i64, i8, u16, u32, u64, u8 } from "~/compiler/intrinsic.ts";
import { AssertUnreachable, Panic } from "~/helper.ts";
import { OperandType } from "~/compiler/codegen/expression/operand.ts";
import { SolidType } from "~/compiler/codegen/expression/type.ts";
import { Instruction } from "~/wasm/index.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { never } from "~/compiler/intrinsic.ts";


export function CompilePrefix(ctx: Context, prefix: Syntax.Term_Expr_prefix, type: OperandType, expect?: SolidType) {
	if (!(type instanceof Intrinsic)) Panic(
		`${colors.red("Error")}: Cannot apply prefix operation to non-variable\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: prefix.ref
	});

	const op = prefix.value[0].value;
	switch (op) {
		case "!":
			Panic(
				`${colors.red("Error")}: Unimplemented negation prefix operation\n`, {
				path: ctx.file.path, name: ctx.file.name, ref: prefix.ref
			});
			break;
		case "-": return CompileInverse(ctx, type, prefix);
		case "return": return CompileReturn(ctx, type, prefix);
		default: AssertUnreachable(op);
	}
}

function CompileInverse(ctx: Context, type: Intrinsic, prefix: Syntax.Term_Expr_prefix) {
	if (type === u8 || type === u16 || type === u32 || type === u64)
		Panic(`${colors.red("Error")}: Cannot invert an unsigned integer\n`, {
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

	Panic(`${colors.red("Error")}: Unhandled arithmetic prefix inversion for type ${type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: prefix.ref
	});
}





function CompileReturn(ctx: Context, type: Intrinsic, prefix: Syntax.Term_Expr_prefix) {
	ctx.scope.cleanup();
	ctx.block.push(Instruction.return());
	ctx.done = true;
	return never;
}