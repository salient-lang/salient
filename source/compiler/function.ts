import type File from "./file.js";
import { Term_Function } from "../bnf/syntax.js";

export default class Function {
	owner: File;
	asts: Term_Function[];
	name: string;

	constructor(owner: File, asts: Term_Function[]) {
		this.owner = owner;
		this.asts = asts;

		this.name = asts[0].value[0].value[0].value;
	}

	merge(other: Function) {
		if (other.name !== this.name)
			throw new Error(`Attempting to merge functions with different names`);

		this.asts.push(...other.asts);
	}
}