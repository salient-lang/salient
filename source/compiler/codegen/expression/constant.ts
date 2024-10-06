import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import { IntrinsicType, bool, u8, i8, u16, i16, u32, i32, u64, i64, f32, f64 } from "~/compiler/intrinsic.ts";
import { AssertUnreachable } from "~/helper.ts";
import { IntrinsicValue } from "~/compiler/intrinsic.ts";
import { Instruction } from "~/wasm/index.ts";
import { SolidType } from "~/compiler/codegen/expression/type.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Panic } from "~/compiler/helper.ts";
import { File } from "~/compiler/file.ts";

export function CompileConstant(ctx: Context, syntax: Syntax.Term_Constant, expect?: SolidType): IntrinsicValue {
	if (!(expect instanceof IntrinsicType)) expect = undefined;
	const val = syntax.value[0];
	switch (val.type) {
		case "boolean": return CompileBool(ctx, val);
		case "float":   return CompileFloat(ctx, val, expect);
		case "integer": return CompileInt(ctx, val, expect);
		case "string":  return CompileString(ctx, val);
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
	return bool.value;
}

function CompileInt(ctx: Context, syntax: Syntax.Term_Integer, expect?: IntrinsicType) {
	let num = Number(syntax.value[0].value);

	if (isNaN(num)) {
		ctx.markFailure(`${colors.red("Error")}: Invalid number ${syntax.value[0].value}\n`, syntax.ref);
		num = 0;
	}

	if (!Number.isInteger(num)) {
		ctx.markFailure(`${colors.red("Error")}: Invalid integer ${syntax.value[0].value}\n`, syntax.ref)
		num = 0;
	};

	const unsigned = expect === u8 || expect === u16 || expect === u32 || expect === u64;
	const size     = expect?.size || 4;

	if (size === 8) {
		ctx.block.push(Instruction.const.i64(num));
		if (unsigned) {
			if (num > 2**64) ctx.markFailure(`${colors.red("Error")}: Value too big for size\n`, syntax.ref);

			return u64.value;
		}

		if (num < -(2**63)) ctx.markFailure(`${colors.red("Error")}: Value too small for size\n`, syntax.ref);
		if (num > 2**63) ctx.markFailure(`${colors.red("Error")}: Value too big for size\n`, syntax.ref);

		return i64.value;
	}

	if (size === 2) {
		ctx.block.push(Instruction.const.i32(num));
		if (unsigned) {
			if (num > 2**16) ctx.markFailure(`${colors.red("Error")}: Value too big for size\n`, syntax.ref);

			return u16.value;
		}

		if (num < -(2**15)) ctx.markFailure(`${colors.red("Error")}: Value too small for size\n`, syntax.ref);
		if (num > 2**15) ctx.markFailure(`${colors.red("Error")}: Value too big for size\n`, syntax.ref);

		return i16.value;
	}

	if (size === 1) {
		ctx.block.push(Instruction.const.i32(num));
		if (unsigned) {
			if (num > 2**8) ctx.markFailure(`${colors.red("Error")}: Value too big for size\n`, syntax.ref);

			return u8.value;
		}

		if (num < -(2**7)) ctx.markFailure(`${colors.red("Error")}: Value too small for size\n`, syntax.ref);
		if (num > 2**7) ctx.markFailure(`${colors.red("Error")}: Value too big for size\n`, syntax.ref);

		return i8.value;
	}

	ctx.block.push(Instruction.const.i32(num));
	if (unsigned) {
		if (num > 2**32) ctx.markFailure(`${colors.red("Error")}: Value too big for size\n`, syntax.ref);

		return u32.value;
	}

	if (num < -(2**31)) ctx.markFailure(`${colors.red("Error")}: Value too small for size\n`, syntax.ref);
	if (num > 2**31) ctx.markFailure(`${colors.red("Error")}: Value too big for size\n`, syntax.ref);

	return i32.value;
}

function CompileFloat(ctx: Context, syntax: Syntax.Term_Float, expect?: IntrinsicType) {
	const num = Number(syntax.value[0].value);

	if (isNaN(num)) ctx.markFailure(`${colors.red("Error")}: Invalid number ${syntax.value[0].value}\n`, syntax.ref);

	if (expect === f64) {
		ctx.block.push(Instruction.const.f64(num));
		return f64.value;
	}

	ctx.block.push(Instruction.const.f32(num));

	return f32.value;
}





const ESCAPE_SYMBOLS = {
	"0": "\0",
	"f": "\f",
	"n": "\n",
	"r": "\r",
	"v": "\v",
};
export function SimplifyString(file: File, syntax: Syntax.Term_String_plain) {
	let str = "";
	for (const chunk of syntax.value[0].value) {
		if (chunk.type == "literal") {
			str += chunk.value;
			continue;
		}

		switch (chunk.type) {
			case "str_hex_u8": {
				const hex: string = chunk.value[0].value;
				str += String.fromCharCode(parseInt(hex, 16));
				break;
			}
			case "str_escape": {
				const esc = chunk.value[0].value;
				if (esc in ESCAPE_SYMBOLS) {
					str += ESCAPE_SYMBOLS[esc as keyof typeof ESCAPE_SYMBOLS];
				} else Panic(`Unknown string escape character "\\${esc}"`,
					{ path: file.path, name: file.name, ref: chunk.ref }
				);
				break;
			}
			default: AssertUnreachable(chunk);
		}
	}

	return str;
}

function CompileString(ctx: Context, syntax: Syntax.Term_String) {
	switch (syntax.value[0].type) {
		case "string_plain":    return CompilePlainString(ctx, syntax.value[0]);
		case "string_template": return CompileTemplateString(ctx, syntax.value[0]);
	}
	AssertUnreachable(syntax.value[0]);
}

function CompilePlainString(ctx: Context, syntax: Syntax.Term_String_plain) {
	const str = SimplifyString(ctx.file, syntax);
	const module = ctx.file.owner.project.module;

	const buffer = module.dataSect.addData(str, 1);

	const ioVec = new Uint32Array(2);
	ioVec[0] = buffer.offset;
	ioVec[1] = buffer.data.byteLength;

	const ptr = module.dataSect.addData(ioVec, 4);

	ctx.block.push(Instruction.const.i32(ptr.offset));
	return i32.value;
}

function CompileTemplateString(ctx: Context, syntax: Syntax.Term_String_template): never {
	throw new Error("Unimplemented template string compilation");
	// return i32.value;
}