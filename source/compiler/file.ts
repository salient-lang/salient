/// <reference lib="deno.ns" />

import type Package from "./package.ts";
import type { Term_Access, Term_Function, Term_Program, Term_Structure } from "~/bnf/syntax.d.ts";

import { Intrinsic, bool, u8, i8, u16, i16, i32, i64, u32, u64, f32, f64 } from "~/compiler/intrinsic.ts";
import { AssertUnreachable, FlatAccess, FlattenAccess } from "~/helper.ts";
import { Parse } from "~/parser.ts";
import Structure from "~/compiler/structure.ts";
import Function from "~/compiler/function.ts";
import Global from "~/compiler/global.ts";
import Import from "~/compiler/import.ts";

export type Namespace = Function | Import | Global | Structure | Intrinsic ;

export class File {
	owner: Package;
	name: string;
	path: string;

	namespace: { [key: string]: Namespace };

	constructor(owner: Package, path: string, name: string, data: string) {
		this.owner = owner;
		this.name = name;
		this.path = path;

		this.namespace = {
			bool,               // virtual native types
			u8, i8, u16, i16,   // virtual native types
			i32, i64, u32, u64, // native int types
			f32, f64            // native floats types
		};
		Ingest(this, Parse(
			data,
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

	getModule() {
		return this.owner.project.module;
	}

	access(name: string): Namespace | null {
		return this.namespace[name] || null;
	}
}


function Ingest(file: File, syntax: Term_Program) {
	for (const stmt of syntax.value[0].value) {
		const stmt_top = stmt.value[0];
		const inner = stmt_top.value[0];

		switch (inner.type) {
			case "function": IngestFunction(file, inner); break;
			case "structure": IngestStructure(file, inner); break;
			default: AssertUnreachable(inner);
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

function IngestStructure(file: File, syntax: Term_Structure) {
	const struct = new Structure(file, syntax);

	const existing = file.namespace[struct.name];
	if (!existing) {
		file.namespace[struct.name] = struct;
		return;
	}

	throw new Error(`Structures cannot share a namespace`);
}