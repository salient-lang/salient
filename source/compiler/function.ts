import type { File, Namespace } from "./file.js";
import { Term_Access, Term_Function } from "../bnf/syntax.js";
import { SourceView } from "../parser.js";
import chalk from "chalk";
import { Intrinsic } from "./intrinsic.js";
import { FlatAccessToStr, FlattenAccess } from "./helper.js";
import { Instruction } from "../wasm/index.js";

export default class Function {
	owner: File;
	ast: Term_Function;
	name: string;

	isCompiled: boolean;
	isLinking:  boolean;
	isLinked:   boolean;

	signature: Intrinsic[];
	returns:   Intrinsic[];

	constructor(owner: File, ast: Term_Function) {
		this.owner = owner;
		this.name = ast.value[0].value[0].value;
		this.ast = ast;

		this.signature = [];
		this.returns   = [];

		this.isLinking  = false;
		this.isLinked   = false;
		this.isCompiled = false;
	}

	getFile() {
		return this.owner;
	}

	declarationView(): string {
		return SourceView(this.owner.path, this.owner.name, this.ast.value[0].ref);
	}

	merge(other: Namespace) {
		console.error(
			(other instanceof Function
				? `${chalk.red("Error")}: Function overloads are not supported\n`
				: `${chalk.red("Error")}: Cannot share a name space between these two\n`)
			+ this.declarationView()
			+ other.declarationView()
		);

		this.owner.markFailure();
	}

	link() {
		if (this.isLinked) return;

		const head = this.ast.value[0];

		const raw_args = head.value[1].value[0].value[0];
		const args = LinkTypes(this.getFile(),
			raw_args ? [
				raw_args.value[0].value[1],
				...raw_args.value[1].value.map(x => x.value[0].value[1])
			] : []
		);
		if (args === null) return;
		this.signature = args;

		const rets = LinkTypes(this.getFile(),
			[head.value[2]]
		);
		if (rets === null) return;
		this.returns = rets;


		this.isLinked = true;
	}


	compile() {
		if (this.isCompiled) return;      // Already compiled
		if (!this.isLinked)  this.link(); // Link if not done already
		if (!this.isLinked)  return;      // Failed to link

		const project = this.getFile().owner;

		const func = project.module.makeFunction(
			this.signature.map(x => x.bitcode),
			this.returns.map(x => x.bitcode)
		);

		func.code.push(Instruction.const.i32(0));
		func.code.push(Instruction.return());
	}
}




function LinkTypes(scope: File, syntax: Term_Access[]) {
	const out: Intrinsic[] = [];

	let failed = false;
	for (const arg of syntax) {
		const flat = FlattenAccess(arg);

		const res = scope.get(flat);
		if (res === null || !(res instanceof Intrinsic)) {
			console.error(
				`${chalk.red("Error")}: Cannot find type\n`
				+ SourceView(scope.path, scope.name, arg.ref)
			)
			failed = true;
			continue;
		}

		out.push(res);
	}

	if (failed) return null;
	return out;
}