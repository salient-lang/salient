import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import Structure from "~/compiler/structure.ts";
import { LinearType, SolidType, OperandType } from "~/compiler/codegen/expression/type.ts";
import { MaybeSingularExprArg } from "~/compiler/codegen/expression/helper.ts";
import { ResolveLinearType } from "~/compiler/codegen/expression/helper.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { Instruction } from "~/wasm/index.ts";
import { SourceView } from "~/parser.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Assign } from "~/compiler/codegen/context.ts";
import { Panic } from "~/compiler/helper.ts";

export function StructBuilder(ctx: Context, syntax: Syntax.Term_Container, expect?: SolidType): OperandType {
	if (!(expect instanceof Structure)) Panic(
		`${colors.red("Error")}: Unable to infer struct type\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});
	if (expect instanceof Structure) expect.link();

	const alloc = ctx.scope.stack.allocate(expect.size, expect.align);
	const linear = LinearType.make(expect, alloc, ctx.file.owner.project.stackBase);
	linear.markConsumed(syntax.ref);

	NestedStructBuilder(ctx, linear, syntax);

	return linear;
}

function NestedStructBuilder(ctx: Context, linear: LinearType, syntax: Syntax.Term_Container) {
	function* iterator(skipLast = false) {
		const base = syntax.value[0].value[0];
		if (!base) return;

		// Skipping the last is the first in this case
		if (skipLast && base.value[1].value.length === 0) return;

		yield base.value[0]; // first

		const length = base.value[1].value.length - ( skipLast ? 1 : 0 );
		for (let i=0; i<length; i++) {
			const next = base.value[1].value[i];
			yield next.value[0];
		}

		return;
	}

	const zeroed = ShouldZero(syntax);
	if (zeroed) {
		ResolveLinearType(ctx, linear, syntax.ref, false);                 // address
		ctx.block.push(Instruction.const.i32(0));                          // value
		ctx.block.push(Instruction.const.i32(linear.getBaseType().size));  // size
		ctx.block.push(Instruction.fill());
	}

	for (const item of iterator(zeroed)) {
		const elm = item.value[0];
		if (elm.type === "container_value") {
			ctx.markFailure(
				`${colors.red("Error")}: Unexpected array value as struct member\n`,
				elm.ref
			);
			continue;
		}

		const name = elm.value[0].value[0].value;
		const target = linear.get(name);
		if (!target) Panic(
			`${colors.red("Error")}: Unknown attribute ${name} in struct ${linear.getBaseType().name}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: elm.ref
		});
		const value = elm.value[1];


		// short circuit: directly write inner container inside self
		const innerContainer = MaybeNestedContainer(value);
		if (innerContainer) {
			NestedStructBuilder(ctx, target, innerContainer);
			continue;
		}


		const expr = CompileExpr(ctx, value, target.getBaseType());
		Assign(ctx, target, expr, elm.ref);
	}

	// All non inited attributes have been filled with zero
	if (zeroed) linear.markDefined();

	return linear;
}

function ShouldZero(syntax: Syntax.Term_Container) {
	const elms = syntax.value[0].value[0];
	if (!elms) return false;

	const chain = elms.value[1];
	const lastI = chain.value.length-1;

	const last_item = 0 <= lastI
		? chain.value[lastI].value[0].value[0]
		: elms.value[0].value[0];

	if (last_item.type === "container_map") return false;

	const expr_arg = MaybeSingularExprArg(last_item.value[0]);
	if (expr_arg === null) return false;
	if (expr_arg.type !== "name") return false;

	return expr_arg.value[0].value === "none";
}

function MaybeNestedContainer(syntax: Syntax.Term_Expr) {
	const expr_val = MaybeSingularExprArg(syntax);
	if (expr_val === null) return null;
	if (expr_val.type != "container") return null;

	return expr_val;
}


export function ArrayBuilder(ctx: Context, syntax: Syntax.Term_Container, expect?: SolidType): OperandType {
	// TODO: Update CompileContainer to derive container type when possible

	if (!expect) Panic(
		`${colors.red("Error")}: Unsupported untyped container creation\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});

	Panic(`${colors.red("Error")}: Arrays are currently unsupported\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);
}