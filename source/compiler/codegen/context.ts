import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import type { File, Namespace } from "~/compiler/file.ts";
import type { Scope } from "./scope.ts";

import * as banned from "~/compiler/codegen/banned.ts";
import Structure from "~/compiler/structure.ts";
import { IntrinsicType, IntrinsicValue, i16, i8, u16, u8 } from "~/compiler/intrinsic.ts";
import { Instruction, AnyInstruction } from "~/wasm/index.ts";
import { AssertUnreachable, Panic } from "~/helper.ts";
import { OperandType } from "~/compiler/codegen/expression/type.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { none, never } from "~/compiler/intrinsic.ts";
import { Block } from "~/wasm/instruction/control-flow.ts";
import { LinearType } from "~/compiler/codegen/expression/type.ts";
import { IntrinsicVariable } from "~/compiler/codegen/variable.ts";
import { StructVariable } from "~/compiler/codegen/variable.ts";
import { Variable } from "~/compiler/codegen/variable.ts";

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
		this.scope.cleanup();
	}
}


function CompileDeclare(ctx: Context, syntax: Syntax.Term_Declare) {
	const name = syntax.value[0].value[0].value;
	const type = syntax.value[1].value[0];
	const expr = syntax.value[2].value[0];

	if (banned.namespaces.includes(name)) Panic(
		`${colors.red("Error")}: You're not allowed to call a variable ${name}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.value[0].value[0].ref }
	)

	if (ctx.scope.hasVariable(name)) Panic(`${colors.red("Error")}: Variable ${name} is already declared\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	let typeRef: Namespace | null = null;
	if (type) {
		typeRef = ctx.file.get(type.value[0]);

		if (typeRef === null || !(typeRef instanceof IntrinsicType) && !(typeRef instanceof Structure)) Panic(
			`${colors.red("Error")}: Cannot find type\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: type.ref }
		)

		if (typeRef === i8 || typeRef === u8 || typeRef === i16 || typeRef === u16) Panic(
			`${colors.red("Error")}: Cannot explicitly use virtual integer types\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: type.ref }
		)
	}

	if (!expr) {
		if (!typeRef) Panic(
			`${colors.red("Error")}: Declared variables must have an explicit or an inferred type\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
		)

		if (typeRef instanceof Structure) {
			typeRef.link();
			const alloc = ctx.scope.stack.allocate(typeRef.size, typeRef.align);
			const linear = LinearType.make(typeRef, alloc, ctx.file.owner.project.stackBase);

			ctx.scope.registerVariable(name, linear, syntax.ref);
		} else {
			ctx.scope.registerVariable(name, typeRef.value, syntax.ref);
		}

		return;
	}

	const value = expr.value[0];
	const resolveType = CompileExpr(ctx, value, typeRef || undefined);

	// Check expected, and inferred matches
	if (typeRef) {
		let baseType = resolveType;

		if ( resolveType instanceof LinearType ) baseType = resolveType.type;
		if ( resolveType instanceof IntrinsicValue ) baseType = resolveType.type;

		if (typeRef !== baseType) Panic(
			`${colors.red("Error")}: type ${typeRef.name} != type ${resolveType.getTypeName()}\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: type?.ref || syntax.ref }
		)
	}

	if (!(resolveType instanceof IntrinsicValue || resolveType instanceof LinearType)) Panic(
		`${colors.red("Error")}: Cannot assign to non-runtime type ${resolveType.getTypeName()}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	)

	const variable = ctx.scope.registerVariable(name, resolveType, syntax.ref);
	variable.markDefined();

	if (variable instanceof IntrinsicVariable) {
		ctx.block.push(Instruction.local.set(variable.register.ref));
	} else if (variable instanceof StructVariable) {
		// No-op for struct as value is already written to stack allocator addr
	} else AssertUnreachable(variable);
}

function CompileAssign(ctx: Context, syntax: Syntax.Term_Assign) {
	const name  = syntax.value[0].value[0].value;
	const value = syntax.value[1];

	const variable = ctx.scope.getVariable(name, false);
	if (!variable) Panic(
		`${colors.red("Error")}: Undeclared variable ${name}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	const resolveType = CompileExpr(ctx, value, variable.getBaseType());

	// Check expected, and inferred match
	if (variable.type) {
		let baseType = resolveType;

		if ( resolveType instanceof LinearType ) baseType = resolveType.type;
		if ( resolveType instanceof IntrinsicValue ) baseType = resolveType.type;

		if (variable.type !== baseType) Panic(
			`${colors.red("Error")}: type ${variable.type.getTypeName()} != type ${resolveType.getTypeName()}\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
		)
	}

	if (variable instanceof IntrinsicVariable) {
		ctx.block.push(Instruction.local.set(variable.register.ref));
	} else if (variable instanceof StructVariable) {
		// TODO: drop previous value
		// TODO: move operation
		console.warn(`Warn: Unimplemented struct re-assign causing unsafe no-op`);
	} else AssertUnreachable(variable);


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

	if (isTail) Panic(`${colors.red("Error")}: Unimplemented tail call return\n`, {
		path: ctx.file.path,
		name: ctx.file.name,
		ref: syntax.ref
	});

	CompileExpr(ctx, value);
	ctx.scope.cleanup();
	ctx.scope.stack.resolve();
	ctx.block.push(Instruction.return());
	ctx.done = true;
}

function CompileRaise(ctx: Context, syntax: Syntax.Term_Raise) {
	ctx.raiseType = CompileExpr(ctx, syntax.value[0]);
	ctx.scope.cleanup();
	ctx.done = true;
}