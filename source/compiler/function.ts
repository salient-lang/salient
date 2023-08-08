import type { File, Namespace } from "./file.js";
import { Term_Function } from "../bnf/syntax.js";
import { SourceView } from "../parser.js";
import chalk from "chalk";

export default class Function {
	owner: File;
	ast: Term_Function;
	name: string;

	constructor(owner: File, ast: Term_Function) {
		this.owner = owner;
		this.name = ast.value[0].value[0].value;
		this.ast = ast;
	}

	declarationView(): string {
		return SourceView(this.owner.path, this.owner.name, this.ast.value[0].ref);
	}

	merge(other: Namespace) {
		console.error(
			(other instanceof Function
				? `${chalk.red("Error")}: Function overrides are not supported\n`
				: `${chalk.red("Error")}: Cannot share a name space between these two\n`)
			+ this.declarationView()
			+ other.declarationView()
		);

		this.owner.markFailure();
	}
}