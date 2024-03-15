import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import Structure from "~/compiler/structure.ts";
import { LinearType, SolidType, OperandType } from "~/compiler/codegen/expression/type.ts";
import { Panic, LatentOffset } from "~/helper.ts";
import { IntrinsicValue } from "~/compiler/intrinsic.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { Instruction } from "~/wasm/index.ts";
import { SourceView } from "~/parser.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Store } from "~/compiler/codegen/expression/helper.ts";

export function StructBuilder(ctx: Context, syntax: Syntax.Term_Container, expect?: SolidType): OperandType {
	if (!(expect instanceof Structure)) Panic(
		`${colors.red("Error")}: Unable to infer struct type\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});
	if (expect instanceof Structure) expect.link();

	const alloc = ctx.scope.stack.allocate(expect.size, expect.align);
	const linear = LinearType.make(expect, alloc, ctx.file.owner.project.stackBase);

	function* iterator() {
		const base = syntax.value[0].value[0];
		if (!base) return;

		yield base.value[0]; // first
		for (const next of base.value[1].value) yield next.value[0]; // comma chained

		return;
	}

	const seen: string[] = [];
	for (const item of iterator()) {
		const elm = item.value[0];
		if (elm.type === "container_value") {
			console.error(
				`${colors.red("Error")}: Unexpected array value as struct member\n`
				+ SourceView(ctx.file.path, ctx.file.name, elm.ref)
			);
			ctx.file.markFailure();
			continue;
		}

		const name = elm.value[0].value[0].value;
		const attr = expect.get(name);
		if (!attr) Panic(
			`${colors.red("Error")}: Unknown attribute ${name} in struct ${expect.name}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: elm.ref
		});

		if (seen.includes(name)) Panic(
			`${colors.red("Error")}: Duplicate ${name} attribute initialization\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: elm.ref
		});
		seen.push(name);

		ctx.block.push(Instruction.const.i32(0));
		const expr = CompileExpr(ctx, elm.value[1], attr.type);
		if (expr instanceof IntrinsicValue) {
			Store(
				ctx, expr.type,
				ctx.file.owner.project.stackBase,
				new LatentOffset(alloc.getOffset(), attr.offset)
			);
		} else Panic(
			`${colors.red("Error")}: Only intrinsics are currently supported\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: elm.ref
		});
	}

	for (const attr of expect.attributes) {
		if (seen.includes(attr.name)) continue;

		const blank = linear.get(attr.name);
		blank?.markConsumed(syntax.ref);
	}

	return linear;
}

export function ArrayBuilder(ctx: Context, syntax: Syntax.Term_Container, expect?: SolidType): OperandType {
	if (!expect) Panic(
		`${colors.red("Error")}: Unsupported untyped container creation\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});

	Panic(`${colors.red("Error")}: Arrays are currently unsupported\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);
}