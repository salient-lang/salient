import { SourceView, type Syntax } from "../../parser.js";
import type { Scope } from "./scope.js";
import type { File } from "../file.js";

import { Instruction, AnyInstruction } from "../../wasm/index.js";
import { AssertUnreachable } from "../../bnf/shared.js";
import { Intrinsic } from "../intrinsic.js";
import chalk from "chalk";

export class Context {
	file: File;
	scope: Scope;
	hasReturned: boolean;

	block: AnyInstruction[];

	constructor(file: File, scope: Scope, block: AnyInstruction[]) {
		this.scope = scope;
		this.block = block;
		this.file  = file;

		this.hasReturned = false;
	}

	compile(syntax: Syntax.Term_Func_stmt[]) {
		for (const stmt of syntax) {
			const line = stmt.value[0];

			switch (line.type) {
				case "declare": CompileDeclare(this, line); break;
				case "func_call": break;
				case "return": break;
				default: AssertUnreachable(line);
			}
		}

		this.block.push(Instruction.const.i32(0));
		this.block.push(Instruction.return());
	}
}


function CompileDeclare(ctx: Context, syntax: Syntax.Term_Declare) {
	const name  = syntax.value[0].value[0].value;
	const type  = syntax.value[1].value[0];
	const value = syntax.value[2];

	if (!type) throw new Error("Unimplemented auto type");
	const typeRef = ctx.file.get(type.value[0]);

	if (typeRef === null || !(typeRef instanceof Intrinsic)) {
		console.error(
			`${chalk.red("Error")}: Cannot find type\n`
			+ SourceView(ctx.file.path, ctx.file.name, type.ref)
		)
		process.exit(1);
	}

	let reg = ctx.scope.registerVariable(name, typeRef, type.ref);
	if (!reg) {
		console.error(
			`${chalk.red("Error")}: Variable ${name} is already declared\n`
			+ SourceView(ctx.file.path, ctx.file.name, type.ref)
		)
		process.exit(1);
	}

	ctx.block.push(Instruction.const.i32(
		Number(
			(value.value[0].value[0]?.value || "")
			+ value.value[1].value
		)
	));
	ctx.block.push(Instruction.local.set(reg.register.ref));

	// console.log(41, syntax, reg);
}