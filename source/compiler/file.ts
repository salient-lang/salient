/// <reference lib="deno.ns" />

import type Package from "./package.ts";
import type { Term_Access, Term_External, Term_Function, Term_Program, Term_Structure, Term_Test } from "~/bnf/syntax.d.ts";

import Structure from "~/compiler/structure.ts";
import Function from "~/compiler/function.ts";
import Global from "~/compiler/global.ts";
import Import from "~/compiler/import.ts";
import { IntrinsicType, bool, u8, i8, u16, i16, i32, i64, u32, u64, f32, f64, none, never } from "~/compiler/intrinsic.ts";
import { FlatAccess, FlattenAccess } from "~/compiler/helper.ts";
import { AssertUnreachable } from "~/helper.ts";
import { SimplifyString } from "~/compiler/codegen/expression/constant.ts";
import { VirtualType } from "~/compiler/intrinsic.ts";
import { Parse } from "~/parser.ts";
import TestCase from "~/compiler/test-case.ts";

export type Namespace = Function | Import | Global | Structure | IntrinsicType | VirtualType ;

// deno-lint-ignore no-explicit-any
export function IsNamespace(val: any): val is Namespace {
	if (val instanceof Function) return true;
	if (val instanceof Global) return true;
	if (val instanceof Import) return true;
	if (val instanceof IntrinsicType) return true;
	if (val instanceof Structure) return true;

	return false;
}

export class File {
	owner: Package;
	name: string;
	path: string;

	namespace: { [key: string]: Namespace };
	tests: TestCase[];
	parseTime: number;

	constructor(owner: Package, path: string, name: string, data: string) {
		this.owner = owner;
		this.name = name;
		this.path = path;

		this.namespace = {
			none, never,
			bool,               // virtual native types
			u8, i8, u16, i16,   // virtual native types
			i32, i64, u32, u64, // native int types
			f32, f64            // native floats types
		};

		this.parseTime = 0;
		this.tests = [];

		const start = Date.now();
		const tree = Parse(
			data,
			this.path,
			this.name
		);
		this.parseTime = Date.now() - start;
		Ingest(this, tree);
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
			case "function":  IngestFunction(file, inner); break;
			case "structure": IngestStructure(file, inner); break;
			case "external":  IngestExternal(file, inner); break;
			case "test":      IngestTest(file, inner); break;
			default: AssertUnreachable(inner);
		}
	}
}

function IngestFunction(file: File, syntax: Term_Function, external?: string) {
	const func = new Function(file, syntax, external);

	const existing = file.namespace[func.name];
	if (!existing) {
		file.namespace[func.name] = func;
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



function IngestExternal(file: File, syntax: Term_External) {
	if (syntax.value[0].type !== "ext_import") throw new Error(`Unsupported external export`);

	const name = SimplifyString(file, syntax.value[0].value[1]);
	for (const inner of syntax.value[0].value[0].value) {
		const line = inner.value[0];
		const type = line.type;
		switch (type) {
			case "function": {
				IngestFunction(file, line, name);
			} break;
			case "ext_import_var": throw new Error(`Import global unimplemented`);
			default: AssertUnreachable(type);
		}
	}

	// const func = new Function(file, syntax);

	// const existing = file.namespace[func.name];
	// if (!existing) {
	// 	file.namespace[func.name] = func;
	// 	return;
	// }

	// if (existing instanceof Function) {
	// 	existing.merge(func);
	// 	return;
	// }

	// throw new Error(`Cannot merge a function with a non-function ${func.name}`);
}

function IngestTest(file: File, syntax: Term_Test) {
	file.tests.push(new TestCase(file, SimplifyString(file, syntax.value[0]), syntax.value[1]));
}