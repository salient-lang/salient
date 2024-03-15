import { BasePointerType, BasePointer } from "~/compiler/codegen/expression/type.ts";
import { LinearType, SolidType } from "~/compiler/codegen/expression/type.ts";
import { AssertUnreachable } from "~/helper.ts";
import { IntrinsicValue, i32 } from "~/compiler/intrinsic.ts";
import { ReferenceRange } from "~/bnf/shared.js";
import { IntrinsicType } from "~/compiler/intrinsic.ts";
import { LatentOffset } from "~/helper.ts";
import { Instruction } from "~/wasm/index.ts";
import { SourceView } from "~/parser.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Panic } from "~/helper.ts";

export function Store(ctx: Context, type: SolidType, base: BasePointer, offset: number | LatentOffset) {
	if (!(type instanceof IntrinsicType)) Panic("Unimplemented");

	const temp = ctx.scope.register.allocate(i32.bitcode, false);
	ctx.block.push(Instruction.local.set(temp.ref));

	switch (base.type) {
		case BasePointerType.global: ctx.block.push(Instruction.global.get(base.id)); break;
		case BasePointerType.local:  ctx.block.push(Instruction.local.get(base.id)); break;
		default: AssertUnreachable(base.type);
	}

	ctx.block.push(Instruction.local.get(temp.ref));
	temp.free();

	DumbStore(ctx, type, offset);
}

export function DumbStore(ctx: Context, type: SolidType, offset: number | LatentOffset) {
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


export function Load(ctx: Context, type: SolidType, base: BasePointer, offset: number | LatentOffset) {
	if (!(type instanceof IntrinsicType)) Panic("Unimplemented");

	const temp = ctx.scope.register.allocate(i32.bitcode, false);
	ctx.block.push(Instruction.local.set(temp.ref));

	switch (base.type) {
		case BasePointerType.global: ctx.block.push(Instruction.global.get(base.id)); break;
		case BasePointerType.local:  ctx.block.push(Instruction.local.get(base.id)); break;
		default: AssertUnreachable(base.type);
	}

	ctx.block.push(Instruction.local.get(temp.ref));
	temp.free();

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


export function ResolveLinearType(ctx: Context, type: LinearType, ref: ReferenceRange) {
	const errs = type.getCompositionErrors();
	if (errs) {
		console.error(`Unable to compose value due to some arguments being uninitialized since:\n`
			+ errs.map(x => SourceView(ctx.file.path, ctx.file.name, x, true)).join("")
			+ SourceView(ctx.file.path, ctx.file.name, ref, false)
		);

		ctx.file.markFailure();
	}

	const base = type.type;
	if (base instanceof IntrinsicValue) {
		Load(ctx, base.type, ctx.file.owner.project.stackBase, type.offset);
	}
}