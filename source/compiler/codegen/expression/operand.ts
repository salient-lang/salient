import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import Structure from "~/compiler/structure.ts";
import { IsContainerType, LinearType, SolidType, OperandType, IsSolidType } from "~/compiler/codegen/expression/type.ts";
import { AssertUnreachable, Panic, LatentOffset } from "~/helper.ts";
import { IntrinsicType, IntrinsicValue, VirtualType, bool } from "~/compiler/intrinsic.ts";
import { CompilePostfixes } from "~/compiler/codegen/expression/postfix.ts";
import { CompileConstant } from "~/compiler/codegen/expression/constant.ts";
import { CompilePrefix } from "~/compiler/codegen/expression/prefix.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { Instruction } from "~/wasm/index.ts";
import { IsNamespace } from "~/compiler/file.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Store } from "~/compiler/codegen/expression/helper.ts";


export function CompileArg(ctx: Context, syntax: Syntax.Term_Expr_arg, expect?: SolidType): OperandType {
	const prefix  = syntax.value[0].value[0];
	const postfix = syntax.value[2].value;
	const val = syntax.value[1].value[0];
	let res: OperandType;
	switch (val.type) {
		case "container":      res = CompileContainer(ctx, val, expect); break;
		case "constant":       res = CompileConstant(ctx, val, expect);  break;
		case "expr_brackets":  res = CompileBrackets(ctx, val, expect);  break;
		case "block":          res = CompileBlock(ctx, val, expect);     break;
		case "name":           res = CompileName(ctx, val);              break;
		case "if":             res = CompileIf(ctx, val, expect);        break;
		default: AssertUnreachable(val);
	}

	if (prefix) res = CompilePrefix(ctx, prefix, res, expect);
	if (postfix.length > 0) res = CompilePostfixes(ctx, postfix, res, expect);

	return res;
}

function CompileContainer(ctx: Context, syntax: Syntax.Term_Container, expect?: SolidType): OperandType {
	if (!expect) Panic(
		`${colors.red("Error")}: Unsupported untyped container creation\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});

	if (!IsContainerType(expect)) Panic(
		`${colors.red("Error")}: Expecting non-container type, unknown container resolution type\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});

	if (expect instanceof Structure) expect.link();
	const alloc = ctx.scope.stack.allocate(expect.size, expect.align);

	function* iterator() {
		const base = syntax.value[0].value[0];
		if (!base) return;

		// first
		yield base.value[0];

		// comma chained
		for (const next of base.value[1].value) yield next.value[0];
	}

	for (const item of iterator()) {
		const elm = item.value[0];
		if (elm.type === "container_value") Panic(
			`${colors.red("Error")}: Arrays are currently unsupported container types\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: elm.ref
		});

		const name = elm.value[0].value[0].value;
		if (!(expect instanceof Structure)) Panic(
			`${colors.red("Error")}: Cannot assign .${name} to an array\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: elm.ref
		});

		const attr = expect.get(name);
		if (!attr) Panic(
			`${colors.red("Error")}: Unknown attribute ${name} in struct ${expect.name}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: elm.ref
		});

		ctx.block.push(Instruction.const.i32(0));
		const expr = CompileExpr(ctx, elm.value[1], attr.type);
		if (!IsSolidType(expr)) Panic(
			`${colors.red("Error")}: Must be a solid type\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: elm.ref
		});

		Store(ctx, expr, new LatentOffset(alloc.getOffset(), attr.offset));
	}

	// TODO: Proper consumption and freeing of allocation
	alloc.free();

	return expect;
}

function CompileBrackets(ctx: Context, syntax: Syntax.Term_Expr_brackets, expect?: SolidType) {
	return CompileExpr(ctx, syntax.value[0], expect);
}

function CompileName(ctx: Context, syntax: Syntax.Term_Name) {
	const name = syntax.value[0].value;
	const variable = ctx.scope.getVariable(name, true);
	if (!variable) {
		const found = ctx.file.access(name);
		if (found === null) Panic(`${colors.red("Error")}: Undeclared term ${name}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		return found;
	}

	if (!variable.isDefined) Panic(`${colors.red("Error")}: Variable ${name} has no value assigned to it\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});

	ctx.block.push(Instruction.local.get(variable.register.ref));
	return variable.type instanceof IntrinsicType
		? variable.type.value
		: variable.type;
}

function CompileIf(ctx: Context, syntax: Syntax.Term_If, expect?: SolidType) {
	const cond = CompileExpr(ctx, syntax.value[0]);
	if (cond instanceof LinearType && cond.type !== bool.value) Panic(
		`${colors.red("Error")}: Invalid comparison type ${cond.type.getTypeName()}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.value[0].ref }
	);

	const scopeIf = ctx.child();
	const typeIf = CompileExpr(scopeIf, syntax.value[1], expect);
	if (IsNamespace(typeIf)) Panic(
		`${colors.red("Error")}: Unsupported namespace yielded from if block\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);
	scopeIf.mergeBlock();

	let typeElse:  OperandType | null = null;
	let scopeElse: Context     | null = null;
	if (syntax.value[2].value[0]) {
		scopeElse = ctx.child();
		typeElse = CompileExpr(scopeElse, syntax.value[2].value[0].value[0], expect);

		if (IsNamespace(typeElse)) Panic(
			`${colors.red("Error")}: Unsupported namespace yielded from else block\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
		);
		scopeElse.mergeBlock();

		if (typeIf != typeElse) Panic(
			`${colors.red("Error")}: Type miss-match between if statement results, ${typeIf.getTypeName()} != ${typeElse.getTypeName()}\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
		);
	}

	let typeIdx = 0x40;
	if (typeIf instanceof IntrinsicValue) typeIdx = ctx.file.getModule().makeType([], [typeIf.type.bitcode]);
	else if (typeIf instanceof VirtualType) typeIdx = 0x40;
	else if (typeIf instanceof LinearType) Panic(
		`${colors.red("Error")}: Unsupported structure raising\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	ctx.block.push(Instruction.if(typeIdx, scopeIf.block, scopeElse?.block));
	return typeIf;
}

function CompileBlock(ctx: Context, syntax: Syntax.Term_Block, expect?: SolidType): OperandType {
	const child = ctx.child();
	child.compile(syntax.value[0].value);
	child.cleanup();

	ctx.block.push(Instruction.block(0x40, child.block));
	return child.raiseType;
}