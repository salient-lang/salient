import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import Structure from "~/compiler/structure.ts";
import { ArrayBuilder, StructBuilder } from "~/compiler/codegen/expression/container.ts";
import { SolidType, OperandType } from "~/compiler/codegen/expression/type.ts";
import { AssertUnreachable } from "~/helper.ts";
import { CompilePostfixes } from "~/compiler/codegen/expression/postfix/index.ts";
import { CompileConstant } from "~/compiler/codegen/expression/constant.ts";
import { CompilePrefix } from "~/compiler/codegen/expression/prefix.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { Instruction } from "~/wasm/index.ts";
import { CompileIf } from "~/compiler/codegen/expression/flow-control.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Panic } from "~/compiler/helper.ts";
import { never } from "~/compiler/intrinsic.ts";



export function CompileArg(ctx: Context, syntax: Syntax.Term_Expr_arg, expect?: SolidType, tailCall = false): OperandType {
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

	const postfix = syntax.value[2].value;
	if (postfix.length > 0) res = CompilePostfixes(ctx, postfix, res, tailCall);

	if (tailCall) {
		if (res != never) ctx.markFailure(
			`${colors.red("Error")}: No actual tail call present where required\n`,
			syntax.ref
		);

		return never;
	}

	const prefix = syntax.value[0].value[0];
	if (prefix) res = CompilePrefix(ctx, prefix, res, expect);

	return res;
}

function CompileContainer(ctx: Context, syntax: Syntax.Term_Container, expect?: SolidType): OperandType {
	if (expect instanceof Structure) return StructBuilder(ctx, syntax, expect);

	switch (syntax.value[0].value[0]?.value[0].value[0].type) {
		case "container_map":   return StructBuilder(ctx, syntax, expect);
		case "container_value": return ArrayBuilder(ctx, syntax, expect);
	}

	Panic(
		`Unable to determine container type\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	})
}

function CompileBrackets(ctx: Context, syntax: Syntax.Term_Expr_brackets, expect?: SolidType): OperandType {
	return CompileExpr(ctx, syntax.value[0], expect);
}

function CompileName(ctx: Context, syntax: Syntax.Term_Name): OperandType {
	const name = syntax.value[0].value;
	const variable = ctx.scope.getVariable(name, true);
	if (!variable) {
		const found = ctx.file.access(name);
		if (found === null) Panic(`${colors.red("Error")}: Undeclared term ${colors.cyan(name)}\n`, {
			path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
		});

		return found;
	}

	return variable.type;
}

function CompileBlock(ctx: Context, syntax: Syntax.Term_Block, expect?: SolidType): OperandType {
	const child = ctx.child();
	child.compile(syntax.value[0].value);
	child.cleanup();

	ctx.exited ||= child.exited;
	ctx.done   ||= child.done;

	ctx.block.push(Instruction.block(0x40, child.block));
	return child.raiseType;
}