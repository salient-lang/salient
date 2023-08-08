import fs from "node:fs";

import type { Term_Function, Term_Program } from "../bnf/syntax.js";
import type Project from "./project.js";
import { Parse } from "../parser.js";

import Function from "./function.js";
import Global from "./global.js";
import Import from "./import.js";
import Structure from "./structure.js";
import { AssertUnreachable } from "../bnf/shared.js";

export type Namespace = Function | Import | Global | Structure ;

export class File {
	owner: Project;
	name: string;
	path: string;

	namespace: { [key: string]: Namespace };

	constructor(owner: Project, path: string, name: string) {
		this.owner = owner;
		this.name = name;
		this.path = path;

		this.namespace = {};
		Ingest(this, Parse(
			fs.readFileSync(this.path, "utf-8"),
			this.path,
			this.name
		));
	}

	markFailure() {
		this.owner.markFailure();
	}
}


function Ingest(file: File, syntax: Term_Program) {
	for (const stmt of syntax.value[0].value) {
		const stmt_top = stmt.value[0];
		const inner = stmt_top.value[0];

		switch (inner.type) {
			case "function": IngestFunction(file, inner); break;
			default: AssertUnreachable(inner.type);
		}
	}
}

function IngestFunction(file: File, syntax: Term_Function) {
	const func = new Function(file, syntax);

	const existing = file.namespace[func.name];
	if (!existing) {
		file.namespace[func.name] = func;
		return;
	}

	if (existing instanceof Function) {
		existing.merge(func);
		return;
	}

	throw new Error(`Cannot merge a function with a non-function ${func.name}`);
}