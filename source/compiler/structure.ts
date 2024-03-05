import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import type { Term_Structure } from "~/bnf/syntax.d.ts";
import type { File, Namespace } from "~/compiler/file.ts";
import { AssertUnreachable, Panic } from "~/helper.ts";
import { IsSolidType, SolidType } from "~/compiler/codegen/expression/type.ts";
import { ReferenceRange } from "~/bnf/shared.d.ts";
import { SourceView } from "~/parser.ts";

export default class Structure {
	owner: File;
	name: string;
	ast: Term_Structure;
	ref: ReferenceRange;

	storage: "sparse" | "aligned" | "linear" | "compact";

	attributes: Array<{
		offset: number,
		name: string,
		type: SolidType,
	}>;
	linked: boolean;
	align: number;
	size: number;

	constructor(owner: File, ast: Term_Structure) {
		this.owner = owner;
		this.name = ast.value[0].value;
		this.ast = ast;
		this.ref = ast.ref;

		this.attributes = [];
		this.linked = false;
		this.align = 0;
		this.size = 0;

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

	link(chain: Structure[] = []) {
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

		for (const stmt of this.ast.value[2].value) {
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
					if (type === null) {
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

					if (type instanceof Structure) type.link(chain);

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

					if (!(other instanceof Structure)) {
						console.error(
							`${colors.red("Error")}: Resolved type must be another structure\n`
							+ SourceView(this.owner.path, this.owner.name, line.value[0].ref)
						);
						this.owner.markFailure();
						continue;
					}

					// Ensure this is linked
					other.link(chain);
				} break;
				default: AssertUnreachable(line);
			}
		}

		const ordered = this.storage === "sparse" || this.storage === "linear";
		const padded  = this.storage === "aligned" || this.storage === "sparse";
		let offset = 0;
		if (ordered) {
			for (const attr of attrs) {
				if (padded) {
					const gap = offset % attr.type.align;
					if (gap !== 0) offset += attr.type.align - gap;
				}

				this.attributes.push({
					offset,
					name: attr.name,
					type: attr.type
				});
				offset += attr.type.size;
			}
		} else {
			while (attrs.length > 0) {
				let aligned = false;
				let bestIdx = 0;
				for (let i=1; i<attrs.length; i++) {
					const gap = offset % attrs[i].type.align;
					if (gap === 0 && !aligned) {
						aligned = true;
						bestIdx = i;
						continue;
					}

					if (attrs[bestIdx].type.size < attrs[i].type.size) {
						bestIdx = i;
						continue;
					}
				}

				const attr = attrs.splice(bestIdx, 1)[0];
				if (padded) {
					const gap = offset % attr.type.align;
					if (gap !== 0) offset += attr.type.align - gap;
				}

				this.attributes.push({
					offset,
					name: attr.name,
					type: attr.type
				});
				offset += attr.type.size;
			}
		}

		this.align = padded
			? Math.max(...this.attributes.map(x => x.type.align))
			: 1;
		this.size = offset;

		this.linked = true;
	}

	get(name: string) {
		this.link(); // ensure struct is linked
		return this.attributes.find(x => x.name == name);
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