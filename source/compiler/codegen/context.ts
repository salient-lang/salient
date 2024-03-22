import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type * as Syntax from "~/bnf/syntax.d.ts";
import type { Scope } from "~/compiler/codegen/scope.ts";
import type { File } from "~/compiler/file.ts";

import * as banned from "~/compiler/codegen/banned.ts";
import Structure from "~/compiler/structure.ts";
import Function from "~/compiler/function.ts";
import { BasePointerType, LinearType, OperandType, SolidType, IsRuntimeType, IsSolidType } from "~/compiler/codegen/expression/type.ts";
import { IntrinsicType, IntrinsicValue, none, never } from "~/compiler/intrinsic.ts";
import { Instruction, AnyInstruction } from "~/wasm/index.ts";
import { ResolveLinearType, Store } from "~/compiler/codegen/expression/helper.ts"
import { AssertUnreachable, Panic } from "~/helper.ts";
import { ReferenceRange } from "~/parser.ts";
import { CompileExpr } from "~/compiler/codegen/expression/index.ts";
import { Variable } from "~/compiler/codegen/variable.ts";
import { Block } from "~/wasm/instruction/control-flow.ts";

export class Context {
	file: File;
	function: Function;
	scope: Scope;
	done: boolean;

	raiseType: OperandType;

	block: AnyInstruction[];

	constructor(file: File, func: Function, scope: Scope, block: AnyInstruction[]) {
		this.function = func;
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
		return new Context(this.file, this.function, this.scope.child(), []);
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

	if (ctx.scope.hasVariable(name)) Panic(
		`${colors.red("Error")}: Variable ${name} is already declared\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);


	// Init variable when type given
	let expectType: SolidType | undefined = undefined;
	let variable: Variable | undefined = undefined;
	if (type) {
		const namespace = ctx.file.get(type.value[0]);

		if (namespace === null) Panic(
			`${colors.red("Error")}: Cannot find type\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: type.ref }
		)

		if (!IsSolidType(namespace)) Panic(
			`${colors.red("Error")}: Cannot declare variable with non-solid type ${colors.cyan(namespace.getTypeName())}\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: type.ref }
		);

		let linear: LinearType;
		if (namespace instanceof IntrinsicType) {
			const alloc = ctx.scope.stack.allocate(namespace.size, namespace.align);
			linear = LinearType.make(namespace.value, alloc, ctx.file.owner.project.stackBase);
		} else if (namespace instanceof Structure) {
			namespace.link();
			const alloc = ctx.scope.stack.allocate(namespace.size, namespace.align);
			linear = LinearType.make(namespace, alloc, ctx.file.owner.project.stackBase);
		} else AssertUnreachable(namespace);

		variable = ctx.scope.registerVariable(name, linear, type.ref);
		linear.markConsumed(syntax.ref); // uninited
		linear.pin();

		expectType = namespace;
	}

	// No assigned value on declaration
	if (!expr){
		if (!variable) Panic(
			`${colors.red("Error")}: Declared variables must have an explicit or an inferred type\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
		)

		return;
	}

	const value = expr.value[0];
	const resolveType = CompileExpr(ctx, value, expectType);

	if (!IsRuntimeType(resolveType)) Panic(
		`${colors.red("Error")}: Cannot assign to a non solid type\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: value.ref }
	);

	// Post init variable, when derived from expression
	if (!variable) {
		let linear: LinearType;
		if (resolveType instanceof IntrinsicValue) {
			const alloc = ctx.scope.stack.allocate(resolveType.type.size, resolveType.type.align);
			linear = LinearType.make(resolveType.type.value, alloc, ctx.file.owner.project.stackBase);
		} else if (resolveType instanceof LinearType) {
			linear = resolveType;
		} else AssertUnreachable(resolveType);

		variable = ctx.scope.registerVariable(name, linear, syntax.ref);
		linear.markConsumed(syntax.ref); // uninited
		linear.pin();
	}


	Assign(ctx, variable.type, resolveType, syntax.ref);
}

function CompileAssign(ctx: Context, syntax: Syntax.Term_Assign) {
	const accessors = syntax.value[0].value[1];
	const name  = syntax.value[0].value[0].value[0].value;
	const value = syntax.value[1];

	const variable = ctx.scope.getVariable(name, false);
	if (!variable) Panic(
		`${colors.red("Error")}: Undeclared variable ${name}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: syntax.ref }
	);

	let target = variable.type;
	for (const syn of accessors.value) {
		const access = syn.value[0].value[0];

		switch (access.type) {
			case "access_static": {
				const name = access.value[0].value;
				const attr = target.get(name);
				if (!attr) Panic(
					`${colors.red("Error")}: Unknown attribute ${name} on ${target.getTypeName()}\n`,
					{ path: ctx.file.path, name: ctx.file.name, ref: access.ref }
				);

				target = attr;
				break;
			}
			default: Panic(
				`${colors.red("Error")}: Access type currently not supported\n`,
				{ path: ctx.file.path, name: ctx.file.name, ref: access.ref }
			)
		}
	}

	if (target.type instanceof IntrinsicValue) {
		switch (target.base.locality) {
			case BasePointerType.global: ctx.block.push(Instruction.global.get(target.base.ref)); break;
			case BasePointerType.local:  ctx.block.push(Instruction.local.get(target.base.ref)); break;
			default: AssertUnreachable(target.base.locality);
		}
	}

	const expr = CompileExpr(ctx, value, target.getBaseType());
	Assign(ctx, target, expr, syntax.ref);
}


export function Assign(ctx: Context, target: LinearType, expr: OperandType, ref: ReferenceRange) {
	if (!IsRuntimeType(expr)) Panic(
		`${colors.red("Error")}: Cannot assign to a non solid type\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: ref }
	)

	const error = () => Panic(
		`${colors.red("Error")}: ${target.type.getTypeName()} != ${expr.getTypeName()}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref: ref }
	);

	if (expr instanceof IntrinsicValue) {
		if (target.type != expr) error();

		// Start stack swap
		const reg = ctx.scope.register.allocate(expr.type.bitcode);
		ctx.block.push(Instruction.local.set(reg.ref));

		// target address
		switch (target.base.locality) {
			case BasePointerType.global: ctx.block.push(Instruction.global.get(target.base.ref)); break;
			case BasePointerType.local:  ctx.block.push(Instruction.local.get(target.base.ref)); break;
			default: AssertUnreachable(target.base.locality);
		}

		// End stack swap
		ctx.block.push(Instruction.local.get(reg.ref));
		reg.free();

		Store(ctx, expr.type, target.offset);
		target.markDefined();
		return;
	}

	if (!(expr instanceof LinearType)) AssertUnreachable(expr);

	if (target.type != expr.type) error();

	// TODO: drop previous value

	// Destination address
	ResolveLinearType(ctx, target, ref, false);
	// Source address
	ResolveLinearType(ctx, expr, ref, false);

	// Transfer
	ctx.block.push(Instruction.const.i32(target.getSize()));
	ctx.block.push(Instruction.copy(0, 0));

	// Duplicate the struct's linear state over
	target.infuse(expr);

	// Clean up the expr generated struct
	expr.dispose();

	return;

}


function CompileStatement(ctx: Context, syntax: Syntax.Term_Statement) {
	const res = CompileExpr(ctx, syntax.value[0]);

	if (res !== none && res !== never) {
		ctx.block.push(Instruction.drop());
	}
}



function CompileReturn(ctx: Context, syntax: Syntax.Term_Return): typeof never {
	const maybe_expr = syntax.value[1].value[0];
	const isTail = syntax.value[0].value.length > 0;
	const ref = syntax.ref;

	if (isTail) Panic(
		`${colors.red("Error")}: Unimplemented tail call return\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref }
	);

	// Guard: return none
	if (ctx.function.returns.length === 0) {
		if (maybe_expr) Panic(
			`${colors.red("Error")}: This function should have no return value\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref }
		);

		ctx.scope.cleanup(true);
		ctx.block.push(Instruction.return());
		ctx.done = true;
		return never;
	}

	if (!maybe_expr) Panic(
		`${colors.red("Error")}: Missing return expression\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref }
	);

	if (ctx.function.returns.length !== 1) Panic(
		`${colors.red("Error")}: Multi value return is currently not supported\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref }
	);

	const goal = ctx.function.returns[0];
	const expr = CompileExpr(ctx, maybe_expr, goal.type || none);
	if (!IsRuntimeType(expr)) Panic(
		`${colors.red("Error")}: You can only return a runtime type, not ${colors.cyan(expr.getTypeName())}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref }
	);

	// Guard: simple intrinsic return
	if (goal.type instanceof IntrinsicType) {
		if (!goal.type.like(expr)) Panic(
			`${colors.red("Error")}: Return type miss-match, expected ${colors.cyan(goal.type.getTypeName())} got ${colors.cyan(expr.getTypeName())}\n`,
			{ path: ctx.file.path, name: ctx.file.name, ref }
		);

		if (expr instanceof LinearType) {
			ResolveLinearType(ctx, expr, ref, true);
			expr.dispose();
		};

		ctx.scope.cleanup(true);
		ctx.block.push(Instruction.return());
		ctx.done = true;
		return never;
	}

	if (expr instanceof IntrinsicValue || !expr.like(goal.type)) Panic(
		`${colors.red("Error")}: Return type miss-match, expected ${colors.cyan(goal.type.getTypeName())} got ${colors.cyan(expr.getTypeName())}\n`,
		{ path: ctx.file.path, name: ctx.file.name, ref }
	);

	const target = ctx.scope.getVariable("return", true);
	if (!target) throw new Error("Missing return variable");

	// Destination address
	ResolveLinearType(ctx, target.type, maybe_expr.ref, false);

	// Source Address
	ResolveLinearType(ctx, expr, maybe_expr.ref, true);

	// Transfer
	ctx.block.push(Instruction.const.i32(goal.type.size));
	ctx.block.push(Instruction.copy(0, 0));

	expr.dispose();

	ctx.scope.cleanup(true);
	ctx.block.push(Instruction.return());
	ctx.done = true;

	return never;
}

function CompileRaise(ctx: Context, syntax: Syntax.Term_Raise) {
	ctx.raiseType = CompileExpr(ctx, syntax.value[0]);
	ctx.scope.cleanup();
	ctx.done = true;
}