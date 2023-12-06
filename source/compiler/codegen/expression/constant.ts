import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import { Intrinsic, f32, f64, i16, i32, i64, i8, u16, u32, u64, u8 } from "~/compiler/intrinsic.ts";
import { Instruction } from "~/wasm/index.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Yeet } from "~/helper.ts";

export function CompileConstInt(ctx: Context, syntax: Syntax.Term_Integer, expect?: Intrinsic) {
	const num = Number(syntax.value[0].value);

	if (isNaN(num))
		Yeet(`${colors.red("Error")}: Invalid number ${syntax.value[0].value}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

	if (!Number.isInteger(num))
		Yeet(`${colors.red("Error")}: Invalid integer ${syntax.value[0].value}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

	const unsigned = expect === u8 || expect === u16 || expect === u32 || expect === u64;
	const size     = expect?.size || 4;

	if (size === 8) {
		ctx.block.push(Instruction.const.i64(num));
		if (unsigned) {
			if (num > 2**64) Yeet(`${colors.red("Error")}: Value too big for size\n`, {
				path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
			});

			return u64
		}

		if (num > 2**63) Yeet(`${colors.red("Error")}: Value too big for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		if (num < -(2**63)) Yeet(`${colors.red("Error")}: Value too small for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		return i64;
	}

	if (size === 2) {
		ctx.block.push(Instruction.const.i32(num));
		if (unsigned) {
			if (num > 2**16) Yeet(`${colors.red("Error")}: Value too big for size\n`, {
				path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
			});

			return u16
		}

		if (num > 2**15) Yeet(`${colors.red("Error")}: Value too big for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		if (num < -(2**15)) Yeet(`${colors.red("Error")}: Value too small for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		return i16;
	}

	if (size === 1) {
		ctx.block.push(Instruction.const.i32(num));
		if (unsigned) {
			if (num > 2**8) Yeet(`${colors.red("Error")}: Value too big for size\n`, {
				path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
			});

			return u8
		}

		if (num > 2**7) Yeet(`${colors.red("Error")}: Value too big for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		if (num < -(2**7)) Yeet(`${colors.red("Error")}: Value too small for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		return i8;
	}

	ctx.block.push(Instruction.const.i32(num));
	if (unsigned) {
		if (num > 2**32) Yeet(`${colors.red("Error")}: Value too big for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		return u32
	}

	if (num > 2**31) Yeet(`${colors.red("Error")}: Value too big for size\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});

	if (num < -(2**31)) Yeet(`${colors.red("Error")}: Value too small for size\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});
	return i32;
}

export function CompileConstFloat(ctx: Context, syntax: Syntax.Term_Float, expect?: Intrinsic) {
	const num = Number(syntax.value[0].value);

	if (isNaN(num))
		Yeet(`${colors.red("Error")}: Invalid number ${syntax.value[0].value}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

	if (expect === f64) {
		ctx.block.push(Instruction.const.f64(num));
		return f64;
	}

	ctx.block.push(Instruction.const.f32(num));
	return f32;
}