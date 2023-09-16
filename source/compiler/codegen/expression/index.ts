import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "../../../bnf/syntax.d.ts";
import { Intrinsic, f32, f64, i16, i32, i64, i8, u16, u32, u64, u8 } from "../../intrinsic.ts";
import { AssertUnreachable, Yeet } from "../../../helper.ts";
import { Instruction } from "../../../wasm/index.ts";
import { Context } from "./../context.ts";

export function CompileExpr(ctx: Context, syntax: Syntax.Term_Expr, expect?: Intrinsic) {
	const op = CompileArg(ctx, syntax.value[0], expect);

	return op;
}


function CompileArg(ctx: Context, syntax: Syntax.Term_Expr_arg, expect?: Intrinsic) {
	const prefix = syntax.value[0].value[0];
	const val = syntax.value[1];
	switch (val.type) {
		case "constant":       return CompileConstant(ctx, val, prefix, expect);
		case "expr_brackets":  throw new Error("1Unimplemented");
		case "expr_val":       throw new Error("2Unimplemented");
		default: AssertUnreachable(val);
	}
}

function CompileConstant(ctx: Context, syntax: Syntax.Term_Constant, prefix?: Syntax.Term_Expr_prefix, expect?: Intrinsic) {
	const val = syntax.value[0];
	switch (val.type) {
		case "boolean": throw new Error("4Unimplemented");
		case "float":   return CompileConstFloat(ctx, val, prefix, expect);
		case "integer": return CompileConstInt(ctx, val, prefix, expect);
		case "string":  throw new Error("6Unimplemented");
		default: AssertUnreachable(val);
	}
}


function CompileConstInt(ctx: Context, syntax: Syntax.Term_Integer, prefix?: Syntax.Term_Expr_prefix, expect?: Intrinsic) {
	let num = Number(syntax.value[0].value);

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
	if (prefix) {
		const op = prefix.value[0].value;
		switch (op) {
			case "!":
				Yeet(`${colors.red("Error")}: Cannot negate an integer\n`, {
					path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
				});
				break;
			case "-":
				if (unsigned)
					Yeet(`${colors.red("Error")}: Cannot have a negative unsigned integer\n`, {
						path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
					});

				num *= -1;
				break;
			default: AssertUnreachable(op);
		}
	}

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

function CompileConstFloat(ctx: Context, syntax: Syntax.Term_Float, prefix?: Syntax.Term_Expr_prefix, expect?: Intrinsic) {
	let num = Number(syntax.value[0].value);

	if (isNaN(num))
		Yeet(`${colors.red("Error")}: Invalid number ${syntax.value[0].value}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

	if (prefix) {
		const op = prefix.value[0].value;
		switch (op) {
			case "!":
				Yeet(`${colors.red("Error")}: Cannot negate an integer\n`, {
					path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
				});
				break;
			case "-":
				num *= -1;
				break;
			default: AssertUnreachable(op);
		}
	}

	if (expect === f64) {
		ctx.block.push(Instruction.const.f64(num));
		return f64;
	}

	ctx.block.push(Instruction.const.f32(num));
	return f32;
}