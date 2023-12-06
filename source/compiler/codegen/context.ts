import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import type { File, Namespace } from "~/compiler/file.ts";
import type { Scope } from "./scope.ts";

import * as banned from "~/compiler/codegen/banned.ts";
import { Intrinsic, i16, i8, u16, u8 } from "~/compiler/intrinsic.ts";
import { Instruction, AnyInstruction } from "~/wasm/index.ts";
import { AssertUnreachable, Yeet } from "~/helper.ts";
import { OperandType } from "~/compiler/codegen/expression/operand.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { none, never } from "~/compiler/intrinsic.ts";
import { Block } from "~/wasm/instruction/control-flow.ts";

export class Context {
	file: File;
	scope: Scope;
	done: boolean;

	raiseType: OperandType;

	block: AnyInstruction[];

	constructor(file: File, scope: Scope, block: AnyInstruction[]) {
		this.raiseType = none;
		this.scope = scope;
		this.block = block;
		this.file  = file;

		this.done = false;
	}

	compile(syntax: Syntax.Term_Block_stmt[]) {
		for (const stmt of syntax) {
			const line = stmt.value[0];

			switch (line.type) {
				case "declare":   CompileDeclare   (this, line); break;
				case "assign":    CompileAssign    (this, line); break;
				case "statement": CompileStatement (this, line); break;
				case "return":    CompileReturn    (this, line); break;
				case "raise":     CompileRaise     (this, line); break;
				default: AssertUnreachable(line);
			}

			if (this.done) {
				this.block.push(Instruction.unreachable());
				break;
			}
		}
	}

	mergeBlock() {
		if (this.block.length !== 1) return;
		if (!(this.block[0] instanceof Block)) return;

		this.block = this.block[0].n;
	}

	child() {
		return new Context(this.file, this.scope.child(), []);
	}

	cleanup() {
		if (this.done) return;
		this.scope.cleanup(this);
	}
}


function CompileDeclare(ctx: Context, syntax: Syntax.Term_Declare) {
	const name = syntax.value[0].value[0].value;
	const type = syntax.value[1].value[0];
	const expr = syntax.value[2].value[0];

	if (banned.namespaces.includes(name))
		Yeet(`${colors.red("Error")}: You're not allowed to call a variable ${name}\n`, {
			path: ctx.file.path,
			name: ctx.file.name,
			ref: syntax.value[0].value[0].ref
		})

	let typeRef: Namespace | null = null;
	if (type) {
		typeRef = ctx.file.get(type.value[0]);

		if (typeRef === null || !(typeRef instanceof Intrinsic))
			Yeet(`${colors.red("Error")}: Cannot find type\n`, {
				path: ctx.file.path,
				name: ctx.file.name,
				ref: type.ref
			})

		if (typeRef === i8 || typeRef === u8 || typeRef === i16 || typeRef === u16)
			Yeet(`${colors.red("Error")}: Cannot explicitly use virtual integer types\n`, {
				path: ctx.file.path,
				name: ctx.file.name,
				ref: type.ref
			})
	}

	if (!expr) {
		if (!typeRef)
			Yeet(`${colors.red("Error")}: Declared variables must have an explicit or an inferred type\n`, {
				path: ctx.file.path,
				name: ctx.file.name,
				ref: syntax.ref
			})

		const variable = ctx.scope.registerVariable(name, typeRef, syntax.ref);
		if (!variable)
			Yeet(`${colors.red("Error")}: Variable ${name} is already declared\n`, {
				path: ctx.file.path,
				name: ctx.file.name,
				ref: syntax.ref
			});

		return;
	}

	const value = expr.value[0];
	const resolveType = CompileExpr(ctx, value, typeRef || undefined);
	if (!typeRef && !resolveType) Yeet(
		`${colors.red("Error")}: Unable to determine type\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);
	if (typeRef && resolveType !== typeRef) Yeet(
		`${colors.red("Error")}: type ${typeRef.name} != type ${resolveType.name}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: type?.ref || syntax.ref }
	)
	if (!(resolveType instanceof Intrinsic)) Yeet(
		`${colors.red("Error")}: Cannot assign variable to non-intrinsic type\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: type?.ref || syntax.ref }
	)

	const variable = ctx.scope.registerVariable(name, typeRef || resolveType, syntax.ref);
	if (!variable)
		Yeet(`${colors.red("Error")}: Variable ${name} is already declared\n`, {
			path: ctx.file.path,
			name: ctx.file.name,
			ref: syntax.ref
		});
	variable.markDefined();

	ctx.block.push(Instruction.local.set(variable.register.ref));
}

function CompileAssign(ctx: Context, syntax: Syntax.Term_Assign) {
	const name  = syntax.value[0].value[0].value;
	const value = syntax.value[1];

	const variable = ctx.scope.getVariable(name);
	if (!variable)
		Yeet(`${colors.red("Error")}: Undeclared variable ${name}\n`, {
			path: ctx.file.path,
			name: ctx.file.name,
			ref: syntax.ref
		});

	const resolveType = CompileExpr(ctx, value, variable.type);
	if (resolveType !== variable.type) Yeet(
		`${colors.red("Error")}: type ${variable.name} != type ${resolveType.name}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	if (!(resolveType instanceof Intrinsic)) Yeet(
		`${colors.red("Error")}: Cannot assign variable to non-intrinsic type\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	)

	ctx.block.push(Instruction.local.set(variable.register.ref));
	variable.markDefined();
}


function CompileStatement(ctx: Context, syntax: Syntax.Term_Statement) {
	const res = CompileExpr(ctx, syntax.value[0]);

	if (res !== none && res !== never) {
		ctx.block.push(Instruction.drop());
	}
}





function CompileReturn(ctx: Context, syntax: Syntax.Term_Return) {
	const isTail = syntax.value[0].value.length > 0;
	const value = syntax.value[1];

	if (isTail) Yeet(`${colors.red("Error")}: Unimplemented tail call return\n`, {
		path: ctx.file.path,
		name: ctx.file.name,
		ref: syntax.ref
	});

	CompileExpr(ctx, value);
	ctx.scope.cleanup(ctx);
	ctx.block.push(Instruction.return());
	ctx.done = true;
}

function CompileRaise(ctx: Context, syntax: Syntax.Term_Raise) {
	ctx.raiseType = CompileExpr(ctx, syntax.value[0]);
	ctx.scope.cleanup(ctx);
	ctx.done = true;
}