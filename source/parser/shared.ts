import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

export class Reference {
	line: number;
	col: number;
	index: number;

	constructor(line = 1, col = 1, index = 0) {
		this.line = line;
		this.col = col;
		this.index = index;
	}

	advance(newline: boolean = false) {
		if (newline) {
			this.col = 1;
			this.line++;
			this.index++;
		} else {
			this.index++;
			this.col++;
		}
	}

	valueOf() {
		return this.index;
	}

	clone(): Reference {
		return new Reference(this.line, this.col, this.index);
	}

	toString(): string {
		return `(${this.line}:${this.col})`;
	}

	format(): string {
		return colors.yellow(this.line.toString())+":"+colors.yellow(this.col.toString())
	}

	static blank() {
		return new Reference(1,1,0);
	}
}



export class ReferenceRange {
	start: Reference;
	end: Reference;

	constructor(from: Reference, to: Reference) {
		this.start = from;
		this.end = to;
	}

	span(other: ReferenceRange) {
		if (other.start.index < this.start.index) {
			this.start = other.start;
		}
		if (other.end.index > this.end.index) {
			this.end = other.end;
		}
	}

	valueOf () {
		return this.end.index;
	}

	clone(): ReferenceRange {
		return new ReferenceRange(this.start.clone(), this.end.clone());
	}

	toString(): string {
		return `${this.start.toString()} -> ${this.end.toString()}`;
	}

	static union(a: ReferenceRange, b: ReferenceRange){
		return new ReferenceRange(
			a.start.index < b.start.index ? a.start.clone() : b.start.clone(), // Smallest
			a.end.index   > b.end.index   ? a.end.clone()   : b.end.clone(),   // Largest
		);
	}

	static intersection(a: ReferenceRange, b: ReferenceRange){
		const start = a.start.index > b.start.index ? a.start.clone() : b.start.clone() // Largest
		const end   = a.end.index   < b.end.index   ? a.end.clone()   : b.end.clone()   // Smallest

		return new ReferenceRange(
			// Make sure start and end haven't switched
			start.index > end.index ? start : end,
			start.index > end.index ? end   : start,
		);
	}

	static blank() {
		return new ReferenceRange(Reference.blank(), Reference.blank());
	}
}