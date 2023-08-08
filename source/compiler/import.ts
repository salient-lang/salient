import chalk from "chalk";
import { Namespace } from "./file.js";

export default class Import {

	declarationView(): string {
		// return SourceView(this.owner.path, this.owner.name, this.ast.value[0].ref);
		return "";
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