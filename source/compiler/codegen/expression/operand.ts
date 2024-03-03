import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import Structure from "~/compiler/structure.ts";
import { AssertUnreachable, Panic } from "~/helper.ts";
import { CompilePostfixes } from "~/compiler/codegen/expression/postfix.ts";
import { Intrinsic, bool } from "~/compiler/intrinsic.ts";
import { CompileConstant } from "~/compiler/codegen/expression/constant.ts";
import { CompilePrefix } from "~/compiler/codegen/expression/prefix.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { VirtualType } from "~/compiler/intrinsic.ts";
import { Instruction } from "~/wasm/index.ts";
import { SolidType } from "~/compiler/codegen/expression/type.ts";
import { Namespace } from "~/compiler/file.ts";
import { Context } from "~/compiler/codegen/context.ts";


export type OperandType = Intrinsic | Namespace | VirtualType;


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
	Panic(
		`${colors.red("Error")}: Unimplemented container parsing\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: syntax.ref
	});
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
	return variable.type;
}

function CompileIf(ctx: Context, syntax: Syntax.Term_If, expect?: SolidType) {
	const cond = CompileExpr(ctx, syntax.value[0]);
	if (cond !== bool) Panic(
		`${colors.red("Error")}: Invalid comparison type ${cond.name}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.value[0].ref }
	);

	const scopeIf = ctx.child();
	const typeIf = CompileExpr(scopeIf, syntax.value[1], expect);
	scopeIf.mergeBlock();

	let typeElse:  OperandType | null = null;
	let scopeElse: Context     | null = null;
	if (syntax.value[2].value[0]) {
		scopeElse = ctx.child();
		typeElse = CompileExpr(scopeElse, syntax.value[2].value[0].value[0], expect);
		scopeElse.mergeBlock();

		if (typeIf != typeElse) Panic(
			`${colors.red("Error")}: Type miss-match between if statement results, ${typeIf.name} != ${typeElse.name}\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
		);
	}

	if (!(typeIf instanceof Intrinsic || typeIf instanceof VirtualType || typeIf instanceof Structure)) Panic(
		`${colors.red("Error")}: Invalid output type from if expression ${typeIf.name}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	let typeIdx = 0x40;
	if (typeIf instanceof Intrinsic) typeIdx = ctx.file.getModule().makeType([], [typeIf.bitcode]);

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