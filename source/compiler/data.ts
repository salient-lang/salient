import * as colors from "fmt/colors";

import type { Term_Data } from "~/bnf/syntax.d.ts";
import type { File, Namespace } from "~/compiler/file.ts";
import Structure from "~/compiler/structure.ts";
import { IsSolidType, SolidType } from "~/compiler/codegen/expression/type.ts";
import { AssertUnreachable } from "~/helper.ts";
import { ReferenceRange } from "~/bnf/shared.d.ts";
import { SourceView } from "~/parser.ts";
import { Panic } from "~/compiler/helper.ts";

export default class Data {
	owner: File;
	name: string;
	ast: Term_Data;
	ref: ReferenceRange;

	attributes: Array<{
		offset: number,
		name: string,
		type: SolidType,
	}>;
	linked: boolean;

	constructor(owner: File, ast: Term_Data) {
		this.owner = owner;
		this.name = ast.value[0].value;
		this.ast = ast;
		this.ref = ast.ref;

		this.attributes = [];
		this.linked = false;
	}

	link(chain: Data[] = []) {
		if (this.linked) return;
		if (chain.includes(this)) Panic(
			`${colors.red("Error")}: This structure is attempting to compose itself\n`
			+ chain.map(x => `${x.name}${x.ref.start.toString()}`).join(' -> ')
			+ ` -> ${this.name}${this.ref.start.toString()}`
		);
		chain.push(this);

		const attrs = Array<{
			name: string,
			type: SolidType
			ref: ReferenceRange
		}>();

		for (const stmt of this.ast.value[1].value) {
			const line = stmt.value[0];
			switch (line.type) {
				case "struct_attr": {
					const name = line.value[0].value;
					const existing = attrs.find(x => x.name === name);
					if (existing) {
						console.error(
							`${colors.red("Error")}: Duplicate attribute name found in struct\n`
							+ SourceView(this.owner.path, this.owner.name, existing.ref)
							+ SourceView(this.owner.path, this.owner.name, line.value[0].ref)
						);
						this.owner.markFailure();
						continue;
					}

					const scope = this.owner;
					const type = scope.get(line.value[1]);
					if (!type) {
						console.error(
							`${colors.red("Error")}: Unable to resolve type\n`
							+ SourceView(this.owner.path, this.owner.name, line.value[1].ref)
						);
						this.owner.markFailure();
						continue;
					}

					if (!IsSolidType(type)) {
						console.error(
							`${colors.red("Error")}: Expected a solid type\n`
							+ SourceView(this.owner.path, this.owner.name, line.value[1].ref)
						);
						console.error(type);
						this.owner.markFailure();
						continue;
					}

					if (type instanceof Structure) {
						console.error(
							`${colors.red("Error")}: Cannot have a struct as element of data\n`
							+ SourceView(this.owner.path, this.owner.name, line.value[1].ref)
						);
						console.error(type);
						this.owner.markFailure();
						continue;
					}
					if (type instanceof Data) type.link(chain);

					attrs.push({ name, type, ref: line.ref });
				} break;
				case "struct_spread": {
					const other = this.owner.get(line.value[0]);
					if (other === null) {
						console.error(
							`${colors.red("Error")}: Unable to resolve type\n`
							+ SourceView(this.owner.path, this.owner.name, line.value[0].ref)
						);
						this.owner.markFailure();
						continue;
					}

					if (other instanceof Structure) other.link();
					else if (other instanceof Data) other.link(chain);
					else {
						console.error(
							`${colors.red("Error")}: Resolved type must be another structure\n`
							+ SourceView(this.owner.path, this.owner.name, line.value[0].ref)
						);
						this.owner.markFailure();
						continue;
					}
				} break;
				default: AssertUnreachable(line);
			}
		}

		this.linked = true;
	}

	get(name: string) {
		this.link(); // ensure struct is linked
		const out = this.attributes.find(x => x.name == name);
		return out;
	}

	getTypeName() {
		return "type " + this.name;
	}

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