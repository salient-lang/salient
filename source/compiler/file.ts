import { AssertUnreachable } from "../bnf/shared.js";
import fs from "node:fs";

import type { Term_Access, Term_Function, Term_Program } from "../bnf/syntax.d.ts";
import type Project from "./project.ts";

import { Intrinsic, i32, i64, u32, u64, f32, f64 } from "./intrinsic.ts";
import { FlatAccess, FlattenAccess } from "../helper.ts";
import { Parse } from "../parser.ts";
import Structure from "./structure.ts";
import Function from "./function.ts";
import Global from "./global.ts";
import Import from "./import.ts";

export type Namespace = Function | Import | Global | Structure | Intrinsic ;

export class File {
	owner: Project;
	name: string;
	path: string;

	namespace: { [key: string]: Namespace };

	constructor(owner: Project, path: string, name: string) {
		this.owner = owner;
		this.name = name;
		this.path = path;

		this.namespace = {
			i32, i64, u32, u64,
			f32, f64
		};
		Ingest(this, Parse(
			fs.readFileSync(this.path, "utf-8"),
			this.path,
			this.name
		));
	}

	markFailure() {
		this.owner.markFailure();
	}

	get(access: Term_Access | FlatAccess): Namespace | null {
		if (!Array.isArray(access)) {
			access = FlattenAccess(access);
		}

		if (access.length !== 1) return null;

		const target = access.pop();
		if (!target) return null;
		if (target.type !== "access_static" && target.type !== "name") return null;

		return this.namespace[target.value[0].value];
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