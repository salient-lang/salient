import chalk from "chalk";

import type { File, Namespace } from "./file.js";
import { ReferenceRange, SourceView } from "../parser.js";

export default class Structure {
	owner: File;
	name: string;

	constructor(owner: File) {
		this.owner = owner;
		this.name = "UNKNOWN";
		// this.name = ast.value[0].value[0].value;
		// this.ast = ast;
	}

	declarationView(): string {
		return SourceView(this.owner.path, this.owner.name, ReferenceRange.blank());
	}

	merge(other: Namespace) {
		console.error(
			`${chalk.red("Error")}: Cannot share a name space between these two\n`
			+ this.declarationView()
			+ other.declarationView()
		);

		// this.owner.markFailure();
	}
}