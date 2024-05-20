import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import { LinearType, SolidType, OperandType } from "~/compiler/codegen/expression/type.ts";
import { IntrinsicValue, VirtualType, bool } from "~/compiler/intrinsic.ts";
import { GetSolidType } from "~/compiler/codegen/expression/type.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { IsNamespace } from "~/compiler/file.ts";
import { Instruction } from "~/wasm/index.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Panic } from "~/compiler/helper.ts";


export function CompileIf(ctx: Context, syntax: Syntax.Term_If, expect?: SolidType): OperandType {
	const cond = CompileExpr(ctx, syntax.value[0]);
	if (cond instanceof LinearType && cond.type !== bool.value) Panic(
		`${colors.red("Error")}: Invalid comparison type ${cond.type.getTypeName()}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.value[0].ref }
	);

	const lifter = ctx.scope.stack.allocate(0, 0);

	const brIf = CompileBranchBody(ctx, syntax.value[1], expect);

	let typeIdx = 0x40;
	if (brIf.type instanceof IntrinsicValue)   typeIdx = ctx.file.getModule().makeType([], [brIf.type.type.bitcode]);
	else if (brIf.type instanceof VirtualType) typeIdx = 0x40;
	else if (brIf.type instanceof LinearType) {
		lifter.align = brIf.type.getAlignment();
		lifter.size = brIf.type.getSize();

		if (!brIf.type.alloc) Panic(
			`${colors.red("Error")}: Lifted struct somehow has no allocation\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: syntax.value[1].ref }
		);

		brIf.type.alloc.moveTo(lifter);
	}

	const elseSyntax = syntax.value[2].value[0];
	if (elseSyntax) {
		const brElse = CompileBranchBody(ctx, elseSyntax.value[0], GetSolidType(brIf.type));

		if (brIf.type instanceof LinearType) {
			if ( !(brElse.type instanceof LinearType) || brIf.type.type !== brElse.type.type ) Panic(
				`${colors.red("Error")}: Type miss-match between if statement results, ${brIf.type.getTypeName()} != ${brElse.type.getTypeName()}\n`,
				{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
			);

			if (!brElse.type.alloc) Panic(
				`${colors.red("Error")}: Lifted struct somehow has no allocation\n`,
				{ path: ctx.file.path, name: ctx.file.name, ref: elseSyntax.value[0].ref }
			);

			brElse.type.alloc.moveTo(lifter);
		} else if (brIf.type != brElse.type) Panic(
			`${colors.red("Error")}: Type miss-match between if statement results, ${brIf.type.getTypeName()} != ${brElse.type.getTypeName()}\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
		);


		ctx.block.push(Instruction.if(typeIdx, brIf.scope.block, brElse.scope?.block));

		ctx.exited ||= brIf.scope.exited && brElse.scope.exited;
		ctx.block.push(Instruction.unreachable());
	} else {
		ctx.block.push(Instruction.if(typeIdx, brIf.scope.block));
	}

	return brIf.type;
}


function CompileBranchBody(ctx: Context, syntax: Syntax.Term_Expr, expect?: SolidType) {
	const stack = ctx.scope.stack.checkpoint();
	const scope = ctx.child();

	// If there is a single block, inline it
	// Otherwise compile the expression inline
	const type = InlineBlock(scope, syntax)
		|| CompileExpr(scope, syntax, expect);

	if (IsNamespace(type)) Panic(
		`${colors.red("Error")}: Unsupported namespace yielded from a branch\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	scope.mergeBlock();
	stack.restore();

	return { stack, scope, type };
}

function InlineBlock(ctx: Context, syntax: Syntax.Term_Expr) {
	// Expression only has a single arg
	if (syntax.value[1].value.length !== 0) return null;

	const arg = syntax.value[0];

	// No prefix operations
	if (arg.value[0].value.length !== 0) return null;

	// No postfix operations
	if (arg.value[2].value.length !== 0) return null;

	// Only a block argument
	if (arg.value[1].value[0].type != "block") return null;

	// Compile each of the block_stmt in the current context
	const block = arg.value[1].value[0];
	ctx.compile(block.value[0].value);

	return ctx.raiseType;
}