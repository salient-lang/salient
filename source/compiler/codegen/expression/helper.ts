import { Instruction, Type } from "~/wasm/index.ts";
import { LatentOffset } from "~/helper.ts";
import { SolidType } from "~/compiler/codegen/expression/type.ts";
import { IntrinsicType } from "~/compiler/intrinsic.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Panic } from "~/helper.ts";

export function Store(ctx: Context, type: SolidType, offset: number | LatentOffset) {
	if (!(type instanceof IntrinsicType)) Panic("Unimplemented");

	switch (type.name) {
		case "u32": case "i32": ctx.block.push(Instruction.i32.store(offset, 1)); break;
		case "u64": case "i64": ctx.block.push(Instruction.i64.store(offset, 1)); break;
		case "u8":  case "i8":  ctx.block.push(Instruction.i32.store8(offset, 1)); break;
		case "u16": case "i16": ctx.block.push(Instruction.i32.store16(offset, 1)); break;
		case "f32": ctx.block.push(Instruction.f32.store(offset, 1)); break;
		case "f64": ctx.block.push(Instruction.f64.store(offset, 1)); break;

		default: Panic(`Unhandled store type ${type.name}`);
	}
}


export function Load(ctx: Context, type: SolidType, offset: number | LatentOffset) {
	if (!(type instanceof IntrinsicType)) Panic("Unimplemented");

	switch (type.name) {
		case "u32": case "i32": ctx.block.push(Instruction.i32.load(offset, 1)); break;
		case "u64": case "i64": ctx.block.push(Instruction.i64.load(offset, 1)); break;
		case "u8":  ctx.block.push(Instruction.i32.load8_u(offset, 1)); break;
		case "i8":  ctx.block.push(Instruction.i32.load8_s(offset, 1)); break;
		case "u16": ctx.block.push(Instruction.i32.load16_u(offset, 1)); break;
		case "i16": ctx.block.push(Instruction.i32.load16_s(offset, 1)); break;
		case "f32": ctx.block.push(Instruction.f32.load(offset, 1)); break;
		case "f64": ctx.block.push(Instruction.f64.load(offset, 1)); break;

		default: Panic(`Unhandled store type ${type.name}`);
	}
}