import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type { Term_Structure } from "~/bnf/syntax.d.ts";
import type { File, Namespace } from "~/compiler/file.ts";
import { SourceView } from "~/parser.ts";
import { Panic } from "~/helper.ts";

export default class Structure {
	owner: File;
	name: string;
	ast: Term_Structure;

	storage: "sparse" | "aligned" | "linear" | "compact";

	constructor(owner: File, ast: Term_Structure) {
		this.owner = owner;
		this.name = ast.value[0].value;
		this.ast = ast;

		const declaredStorage = ast.value[1].value[0]?.value[0].value;
		switch (declaredStorage) {
			case undefined:
				this.storage = "sparse";
				break;
			case "sparse": case "aligned": case "linear": case "compact":
				this.storage = declaredStorage;
				break;
			default:
				Panic(
					`${colors.red("Error")}: Invalid structure layout ${declaredStorage}\n`
					+ this.declarationView()
				);
		}
	}

	link() {}

	declarationView(): string {
		return SourceView(this.owner.path, this.owner.name, this.ast.ref);
	}

	merge(other: Namespace) {
		console.error(
			`${colors.red("Error")}: Cannot share a name space between these two\n`
			+ this.declarationView()
			+ other.declarationView()
		);

		this.owner.markFailure();
	}
}