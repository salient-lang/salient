import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import { IntrinsicValue, VirtualType, bool, none } from "~/compiler/intrinsic.ts";
import { LinearType, SolidType, OperandType } from "~/compiler/codegen/expression/type.ts";
import { ReferenceRange } from "~/parser.ts";
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

		ResolveBranchFlow(ctx, [brIf.scope, brElse.scope], true, syntax.ref);
	} else {
		ctx.block.push(Instruction.if(typeIdx, brIf.scope.block));
		ResolveBranchFlow(ctx, [brIf.scope], false, syntax.ref);
	}

	return brIf.type;
}


export function CompileWhile(ctx: Context, syntax: Syntax.Term_While, expect?: SolidType) {
	const stack = ctx.scope.stack.checkpoint();
	const scope = ctx.child();


	const cond = CompileExpr(scope, syntax.value[0]);
	if (cond instanceof LinearType && cond.type !== bool.value) Panic(
		`${colors.red("Error")}: Invalid comparison type ${cond.type.getTypeName()}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.value[0].ref }
	);

	scope.block.push(Instruction.i32.const(0));
	scope.block.push(Instruction.i32.eq());
	scope.block.push(Instruction.br_if(1));

	const type = InlineBlock(scope, syntax.value[1])
		|| CompileExpr(scope, syntax.value[1], bool);
	if (type !== none) Panic(
		`${colors.red("Error")}: Loop body cannot lift a value\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.value[0].ref }
	);

	scope.block.push(Instruction.br(0));

	scope.mergeBlock();
	stack.restore();

	ctx.block.push(Instruction.block(0x40, [
		Instruction.loop(scope.block),
		Instruction.noop()
	]));

	return none;
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

function ResolveBranchFlow(parent: Context, branches: Context[], totality = false, ref: ReferenceRange) {
	// If totality is true, execution must pass through at least one of these branches
	// So it doesn't matter if any branch changes the state relative to the parent
	// As long as all branches perform equivalent changes

	const bad = [];

	// Get list of parent variables which are changed in all branches
	const override: string[] = [];
	if (totality) {
		outer: for (const name in branches[0].scope.vars) {
			// Ignore child vars
			if (!branches[0].scope.vars[name].isClone) continue;

			for (let i=1; i<branches.length; i++) {
				const branch = branches[i];
				if (!branch.scope.vars[name]) continue outer;
			}

			override.push(name);
		}
	}

	// Check all totality changes align each other (use first as ref)
	const base = branches[0].scope.vars;
	outer: for (const name of override) {
		for (let i=1; i<branches.length; i++) {
			const branch = branches[i];

			const ok = base[name].type.compositionallyEquivalent(branch.scope.vars[name].type);
			if (!ok) {
				bad.push(name);
				continue outer;
			}
		}

		parent.scope.vars[name].type.infuseComposition(base[name].type);
	}

	// Check all non-totality changes align with parent
	for (const branch of branches) {
		for (const name in branch.scope.vars) {
			// Ignore child vars
			if (!branch.scope.vars[name].isClone) continue;

			// Skip, already processed
			if (override.includes(name)) continue;

			const ok = parent.scope.vars[name].type.compositionallyEquivalent(branch.scope.vars[name].type);
			if (!ok) bad.push(name);
		}
	}

	if (bad.length > 0) parent.markFailure(
		`${colors.red("Error")}: Variables ${bad.map(colors.cyan).join(", ")} `
			+ (bad.length == 1 ? "has" : "have")
			+ ` an undeterminable states after branching here\n`,
	ref);
}