import { AssertUnreachable, LatentOffset, Panic } from "~/helper.ts";
import { IntrinsicType, IntrinsicValue } from "~/compiler/intrinsic.ts";
import { BasePointerType, LinearType } from "~/compiler/codegen/expression/type.ts";
import { ReferenceRange } from "~/bnf/shared.js";
import { Instruction } from "~/wasm/index.ts";
import { SourceView } from "~/parser.ts";
import { Context } from "~/compiler/codegen/context.ts";

export function Store(ctx: Context, type: IntrinsicType, offset: number | LatentOffset) {
	switch (type.name) {
		case "u32": case "i32": ctx.block.push(Instruction.i32.store(offset, 0)); break;
		case "u64": case "i64": ctx.block.push(Instruction.i64.store(offset, 0)); break;
		case "u8":  case "i8":  ctx.block.push(Instruction.i32.store8(offset, 0)); break;
		case "u16": case "i16": ctx.block.push(Instruction.i32.store16(offset, 0)); break;
		case "f32": ctx.block.push(Instruction.f32.store(offset, 1)); break;
		case "f64": ctx.block.push(Instruction.f64.store(offset, 1)); break;

		default: Panic(`Unhandled store type ${type.name}`);
	}
}


export function Load(ctx: Context, type: IntrinsicType, offset: number | LatentOffset) {
	switch (type.name) {
		case "u32": case "i32": ctx.block.push(Instruction.i32.load(offset, 0)); break;
		case "u64": case "i64": ctx.block.push(Instruction.i64.load(offset, 0)); break;
		case "u8":  ctx.block.push(Instruction.i32.load8_u(offset, 0)); break;
		case "i8":  ctx.block.push(Instruction.i32.load8_s(offset, 0)); break;
		case "u16": ctx.block.push(Instruction.i32.load16_u(offset, 0)); break;
		case "i16": ctx.block.push(Instruction.i32.load16_s(offset, 0)); break;
		case "f32": ctx.block.push(Instruction.f32.load(offset, 0)); break;
		case "f64": ctx.block.push(Instruction.f64.load(offset, 0)); break;

		default: Panic(`Unhandled store type ${type.name}`);
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
		Load(ctx, baseType, type.offset);
		return;
	}

	// Push the complete pointer to the stack
	if (type.alloc) {
		ctx.block.push(Instruction.const.i32(type.offset));
		ctx.block.push(Instruction.i32.add());
	}

	if (type.offset !== 0) ctx.block.push(Instruction.const.i32(type.offset));
}