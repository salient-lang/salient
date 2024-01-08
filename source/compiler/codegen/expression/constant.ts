import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import { Intrinsic, bool, u8, i8, u16, i16, u32, i32, u64, i64, f32, f64 } from "~/compiler/intrinsic.ts";
import { AssertUnreachable, Panic } from "~/helper.ts";
import { Instruction } from "~/wasm/index.ts";
import { Context } from "~/compiler/codegen/context.ts";

export function CompileConstant(ctx: Context, syntax: Syntax.Term_Constant, expect?: Intrinsic) {
	const val = syntax.value[0];
	switch (val.type) {
		case "boolean": return CompileBool(ctx, val);
		case "float":   return CompileFloat(ctx, val, expect);
		case "integer": return CompileInt(ctx, val, expect);
		case "string":  throw new Error("Unimplemented string constant");
		default: AssertUnreachable(val);
	}
}

export function CompileBool(ctx: Context, syntax: Syntax.Term_Boolean) {
	let num = -1;
	switch (syntax.value[0].value) {
		case "false": num = 0; break;
		case "true":  num = 1; break;
		default: AssertUnreachable(syntax.value[0]);
	}

	ctx.block.push(Instruction.const.i32(num));
	return bool;
}

function CompileInt(ctx: Context, syntax: Syntax.Term_Integer, expect?: Intrinsic) {
	const num = Number(syntax.value[0].value);

	if (isNaN(num))
		Panic(`${colors.red("Error")}: Invalid number ${syntax.value[0].value}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

	if (!Number.isInteger(num))
		Panic(`${colors.red("Error")}: Invalid integer ${syntax.value[0].value}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

	const unsigned = expect === u8 || expect === u16 || expect === u32 || expect === u64;
	const size     = expect?.size || 4;

	if (size === 8) {
		ctx.block.push(Instruction.const.i64(num));
		if (unsigned) {
			if (num > 2**64) Panic(`${colors.red("Error")}: Value too big for size\n`, {
				path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
			});

			return u64
		}

		if (num > 2**63) Panic(`${colors.red("Error")}: Value too big for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		if (num < -(2**63)) Panic(`${colors.red("Error")}: Value too small for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		return i64;
	}

	if (size === 2) {
		ctx.block.push(Instruction.const.i32(num));
		if (unsigned) {
			if (num > 2**16) Panic(`${colors.red("Error")}: Value too big for size\n`, {
				path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
			});

			return u16
		}

		if (num > 2**15) Panic(`${colors.red("Error")}: Value too big for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		if (num < -(2**15)) Panic(`${colors.red("Error")}: Value too small for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		return i16;
	}

	if (size === 1) {
		ctx.block.push(Instruction.const.i32(num));
		if (unsigned) {
			if (num > 2**8) Panic(`${colors.red("Error")}: Value too big for size\n`, {
				path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
			});

			return u8
		}

		if (num > 2**7) Panic(`${colors.red("Error")}: Value too big for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		if (num < -(2**7)) Panic(`${colors.red("Error")}: Value too small for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		return i8;
	}

	ctx.block.push(Instruction.const.i32(num));
	if (unsigned) {
		if (num > 2**32) Panic(`${colors.red("Error")}: Value too big for size\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		return u32
	}

	if (num > 2**31) Panic(`${colors.red("Error")}: Value too big for size\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});

	if (num < -(2**31)) Panic(`${colors.red("Error")}: Value too small for size\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});
	return i32;
}

function CompileFloat(ctx: Context, syntax: Syntax.Term_Float, expect?: Intrinsic) {
	const num = Number(syntax.value[0].value);

	if (isNaN(num))
		Panic(`${colors.red("Error")}: Invalid number ${syntax.value[0].value}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

	if (expect === f64) {
		ctx.block.push(Instruction.const.f64(num));
		return f64;
	}

	ctx.block.push(Instruction.const.f32(num));
	return f32;
}