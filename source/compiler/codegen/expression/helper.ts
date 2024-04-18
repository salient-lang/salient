import type * as Syntax from "~/bnf/syntax.d.ts";

import { AssertUnreachable, LatentOffset } from "~/helper.ts";
import { BasePointerType, LinearType } from "~/compiler/codegen/expression/type.ts";
import { ReferenceRange } from "~/bnf/shared.js";
import { IntrinsicType } from "~/compiler/intrinsic.ts";
import { Instruction } from "~/wasm/index.ts";
import { SourceView } from "~/parser.ts";
import { Context } from "~/compiler/codegen/context.ts";


export function MaybeSingularExprArg(syntax: Syntax.Term_Expr) {
	const noInfix = syntax.value[1].value.length == 0;
	if (!noInfix) return null;

	const expr_arg = syntax.value[0];
	const expr_val = expr_arg.value[1];

	const hasPrefix = expr_arg.value[0].value.length != 0;
	if (hasPrefix) return null;

	const hasPostfix = expr_arg.value[2].value.length != 0;
	if (hasPostfix) return null;

	return expr_val.value[0];
}


export function Store(ctx: Context, type: IntrinsicType, offset: number | LatentOffset, ref: ReferenceRange) {
	switch (type.name) {
		case "u32": case "i32": ctx.block.push(Instruction.i32.store(offset, 0)); break;
		case "u64": case "i64": ctx.block.push(Instruction.i64.store(offset, 0)); break;
		case "u8":  case "i8":  ctx.block.push(Instruction.i32.store8(offset, 0)); break;
		case "u16": case "i16": ctx.block.push(Instruction.i32.store16(offset, 0)); break;
		case "f32": ctx.block.push(Instruction.f32.store(offset, 1)); break;
		case "f64": ctx.block.push(Instruction.f64.store(offset, 1)); break;

		default: ctx.markFailure(`Unhandled store type ${type.name}`, ref);
	}
}


export function Load(ctx: Context, type: IntrinsicType, offset: number | LatentOffset, ref: ReferenceRange) {
	switch (type.name) {
		case "u32": case "i32": ctx.block.push(Instruction.i32.load(offset, 0)); break;
		case "u64": case "i64": ctx.block.push(Instruction.i64.load(offset, 0)); break;
		case "u8":  ctx.block.push(Instruction.i32.load8_u(offset, 0)); break;
		case "i8":  ctx.block.push(Instruction.i32.load8_s(offset, 0)); break;
		case "u16": ctx.block.push(Instruction.i32.load16_u(offset, 0)); break;
		case "i16": ctx.block.push(Instruction.i32.load16_s(offset, 0)); break;
		case "f32": ctx.block.push(Instruction.f32.load(offset, 0)); break;
		case "f64": ctx.block.push(Instruction.f64.load(offset, 0)); break;

		default: ctx.markFailure(`Unhandled store type ${type.name}`, ref);
	}
}


export function ResolveLinearType(ctx: Context, type: LinearType, ref: ReferenceRange, strict = true) {
	if (strict) {
		const errs = type.getCompositionErrors();
		if (errs) {
			console.error(`Unable to compose value due to some arguments being uninitialized since:\n`
				+ errs.map(x => SourceView(ctx.file.path, ctx.file.name, x, true)).join("")
				+ SourceView(ctx.file.path, ctx.file.name, ref, false)
			);

			ctx.file.markFailure();
		}
	}

	const baseType = type.getBaseType();
	switch (type.base.locality) {
		case BasePointerType.global: ctx.block.push(Instruction.global.get(type.base.ref)); break;
		case BasePointerType.local:  ctx.block.push(Instruction.local.get(type.base.ref)); break;
		default: AssertUnreachable(type.base.locality);
	}

	// Auto load intrinsic value from a linear type
	if (baseType instanceof IntrinsicType) {
		Load(ctx, baseType, type.offset, ref);
		return baseType.value;
	}

	// Push the complete pointer to the stack
	if (type.offset !== 0) {
		ctx.block.push(Instruction.const.i32(type.offset));
		ctx.block.push(Instruction.i32.add());
	};
	return type;
}