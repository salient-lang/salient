import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type { File, Namespace } from "./file.ts";
import { ReferenceRange, SourceView } from "~/parser.ts";

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
			`${colors.red("Error")}: Cannot share a name space between these two\n`
			+ this.declarationView()
			+ other.declarationView()
		);

		// this.owner.markFailure();
	}
}