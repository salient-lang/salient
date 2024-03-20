import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import Structure from "~/compiler/structure.ts";
import { LinearType, SolidType, OperandType } from "~/compiler/codegen/expression/type.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { SourceView } from "~/parser.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Assign } from "~/compiler/codegen/context.ts";
import { Panic } from "~/helper.ts";

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
	function* iterator() {
		const base = syntax.value[0].value[0];
		if (!base) return;

		yield base.value[0]; // first
		for (const next of base.value[1].value) yield next.value[0]; // comma chained

		return;
	}

	for (const item of iterator()) {
		const elm = item.value[0];
		if (elm.type !== "container_map") {
			console.error(
				`${colors.red("Error")}: Unexpected array value as struct member\n`
				+ SourceView(ctx.file.path, ctx.file.name, elm.ref)
			);
			ctx.file.markFailure();
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

	return linear;
}

function MaybeNestedContainer(syntax: Syntax.Term_Expr) {
	const noInfix = syntax.value[1].value.length == 0;
	if (!noInfix) return null;

	const expr_arg = syntax.value[0];
	const expr_val = expr_arg.value[1];
	if (expr_val.value[0].type != "container") return null;

	const hasPrefix = expr_arg.value[0].value.length != 0;
	if (hasPrefix) return null;

	const hasPostfix = expr_arg.value[2].value.length != 0;
	if (hasPostfix) return null;

	return expr_val.value[0];
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