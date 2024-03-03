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


export function FlatAccessToStr(access: FlatAccess): string {
	return access.map(x =>
		x.type === "access_static" ? `.${x.value}`
		: x.type === "name" ? `.${x.value}`
		: x.type === "access_dynamic" ? "[]"
		: x.type === "access_comp" ? "#[]"
		: "UNK"
	).join("")
}


export type Byte = number;

export function isByte(value: number): value is Byte {
	return Number.isInteger(value) && value >= 0 && value <= 255;
}


export function AssertUnreachable(x: never): never {
	throw new Error("Unreachable code path reached");
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


export class LatentValue<T> {
	private value: T | null;

	constructor() {
		this.value = null;
	}

	get () {
		if (this.value === null) throw new Error("Attempting to read latent value before it's been resolved");

		return this.value;
	}

	clear() {
		this.value === null;
	}

	resolve(val: T, force = false) {
		if (this.value !== null && !force)
			throw new Error("Attempt to re-resolve already resolved latent value");

		this.value = val;
	}
}

export class LatentOffset {
	private base: LatentValue<number>;
	private offset: number;

	constructor(base: LatentValue<number> | LatentOffset, offset: number) {
		if (base instanceof LatentOffset) {
			this.offset = base.offset + offset;
			this.base = base.base;
		} else {
			this.offset = offset;
			this.base = base;
		}
	}

	get () {
		return this.base.get() + this.offset;
	}
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