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


export class Box<T> {
	value: T;
	constructor(val: T) {
		this.value = val;
	}
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

	get (): T {
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

export type LatentLike<T> = LatentValue<T> | T;


export function ReadLatentLike<T>(v: LatentLike<T>) {
	if (v instanceof LatentValue) return v.get();
	return v;
}

export class LatentOffset {
	private base: LatentValue<number>;
	private offset: number;
	private value: number | null;

	constructor(base: LatentValue<number> | LatentOffset, offset: number) {
		if (base instanceof LatentOffset) {
			this.offset = base.offset + offset;
			this.base = base.base;
			this.value = null;
		} else {
			this.offset = offset;
			this.base = base;
			this.value = null;
		}
	}

	get (): number {
		if (this.value === null) {
			this.value = this.base.get() + this.offset;
		}

		return this.value;
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




const _timer: { [key: string]: { start: number, end: number } } = {};
export function TimerStart(key: string) {
	const now = Date.now();
	_timer[key] = { start: now, end: now-1 };
}

export function TimerEnd(key: string) {
	const now = Date.now();
	if (!_timer[key]) return;
	_timer[key].end = now;
}

export function DisplayTimers() {
	const lines: string[][] = [];
	const max = [0, 0];
	for (const key in _timer) {
		const entry = _timer[key];
		const line = [key, (entry.end - entry.start)+"ms"];

		max[0] = Math.max(max[0], line[0].length);
		max[1] = Math.max(max[1], line[1].length);

		lines.push(line);
	}

	let str = "Timers:";
	for (const line of lines) {
		str += `\n  ${line[0].padEnd(max[0])}  ${line[1].padStart(max[1])}`;
	}

	console.info(str);
}