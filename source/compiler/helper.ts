import { assert } from "https://deno.land/std@0.201.0/assert/mod.ts";

import type { Term_Access, Term_Access_comp, Term_Access_dynamic, Term_Access_static, Term_Name } from "~/bnf/syntax.d.ts";
import type { ReferenceRange } from "~/bnf/shared.d.ts";
import { SourceView } from "~/parser.ts";

export type FlatAccess = (Term_Name | Term_Access_static | Term_Access_dynamic | Term_Access_comp)[];

export function FlattenAccess(syntax: Term_Access): FlatAccess {
	return [
		syntax.value[0],
		...syntax.value[1].value.map(x => x.value[0].value[0])
	].reverse();
}





export type SourceMap = {
	path: string,
	name: string,
	ref:  ReferenceRange
}

export function Panic(x: string, source?: SourceMap): never {
	if (source) console.error(x + SourceView(source.path, source.name, source.ref));
	else        console.error(x);
	Deno.exit(1);
}

export function Warn(x: string, source?: SourceMap) {
	if (source) console.warn(x + SourceView(source.path, source.name, source.ref));
	else        console.warn(x);
}





export function AlignUpInteger(x: number, multiple: number) {
	assert(multiple !== 0, "Cannot align by zero");

	const remainder = x % multiple;
	return remainder !== 0
		? x + (multiple - remainder)
		: x;
}

export function AlignDownInteger(x: number, multiple: number) {
	assert(multiple !== 0, "Cannot align by zero");

	const remainder = x % multiple;
	return remainder !== 0
		? x - remainder
		: x;
}