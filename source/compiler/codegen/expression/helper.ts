import type * as Syntax from "~/bnf/syntax.d.ts";
import { red } from "https://deno.land/std@0.201.0/fmt/colors.ts";

import * as WasmTypes from "~/wasm/type.ts";
import { AssertUnreachable, LatentOffset } from "~/helper.ts";
import { BasePointerType, LinearType } from "~/compiler/codegen/expression/type.ts";
import { ReferenceRange } from "~/bnf/shared.js";
import { IntrinsicType, f32, f64, i32, i64 } from "~/compiler/intrinsic.ts";
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


export function InlineClamp(ctx: Context, type: IntrinsicType, min: number | null, max: number | null) {
	let scope;
	switch (type.bitcode) {
		case WasmTypes.Intrinsic.i32: scope = Instruction.i32; break;
		case WasmTypes.Intrinsic.i64: scope = Instruction.i64; break;
		case WasmTypes.Intrinsic.f32: scope = Instruction.f32; break;
		case WasmTypes.Intrinsic.f64: scope = Instruction.f64; break;
		default: throw "Assert failed";
	}

	const x = ctx.scope.register.allocate(type.bitcode);
	if (min !== null) {
		ctx.block.push(Instruction.local.tee(x.ref));
		ctx.block.push(scope.const(min));

		if ("lt" in scope) ctx.block.push(scope.lt());
		else {
			if (type.signed) ctx.block.push(scope.lt_s());
			else ctx.block.push(scope.lt_u());
		}

		ctx.block.push(Instruction.if(type.bitcode,
			[ scope.const(min) ],
			[ Instruction.local.get(x.ref) ],
		));
	}

	if (max !== null) {
		ctx.block.push(Instruction.local.tee(x.ref));
		ctx.block.push(scope.const(max));

		if ("gt" in scope) ctx.block.push(scope.gt());
		else {
			if (type.signed) ctx.block.push(scope.gt_s());
			else ctx.block.push(scope.gt_u());
		}

		ctx.block.push(Instruction.if(type.bitcode,
			[ scope.const(max) ],
			[ Instruction.local.get(x.ref) ],
		));
	}

	x.free();
}


export function ResolveLinearType(ctx: Context, type: LinearType, ref: ReferenceRange, strict = true) {
	if (strict) {
		const errs = type.getCompositionErrors();
		if (errs) {
			const range = ref.clone();
			for (const err of errs) {
				range.span(err);
			}

			console.error(`${red("Error")}: Unable to compose value due to some arguments being uninitialized since: ${errs.map(x => x.start.toString()).join(", ")}\n`
				+ errs.map(x => SourceView(ctx.file.path, ctx.file.name, x, true)).join("")
				+ SourceView(ctx.file.path, ctx.file.name, ref, true)
				+ `  ${ctx.file.name} ${range.toString()}\n`
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