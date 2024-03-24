export type Byte = number;
export function isByte(value: number): value is Byte {
	return Number.isInteger(value) && value >= 0 && value <= 255;
}


export function AssertUnreachable(x: never): never {
	throw new Error("Unreachable code path reached");
}




export class Box<T> {
	value: T;
	constructor(val: T) {
		this.value = val;
	}
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

export class LatentOffset {
	private base: LatentValue<number>;
	private offset: number;
	private cache: number | null;

	constructor(base: LatentValue<number> | LatentOffset, offset: number) {
		if (base instanceof LatentOffset) {
			this.offset = base.offset + offset;
			this.base = base.base;
			this.cache = null;
		} else {
			this.offset = offset;
			this.base = base;
			this.cache = null;
		}
	}

	get (): number {
		if (this.cache === null) {
			this.cache = this.base.get() + this.offset;
		}

		return this.cache;
	}
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