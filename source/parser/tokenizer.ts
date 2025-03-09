import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import { Reference, ReferenceRange } from "~/parser/shared.ts";

export class TokenName {
	readonly value: string;
	readonly ref: ReferenceRange;

	constructor (value: string, ref: ReferenceRange) {
		this.value = value;
		this.ref   = ref;
	}
}

export class TokenInteger {
	readonly value: number;
	readonly ref: ReferenceRange;

	constructor (raw: number, ref: ReferenceRange) {
		this.value = raw;
		this.ref   = ref;
	}
}

export class TokenFloat {
	readonly value: number;
	readonly ref: ReferenceRange;

	constructor (raw: number, ref: ReferenceRange) {
		this.value = raw;
		this.ref   = ref;
	}
}

export class TokenBoolean {
	readonly value: boolean;
	readonly ref: ReferenceRange;

	constructor (raw: boolean, ref: ReferenceRange) {
		this.value = raw;
		this.ref   = ref;
	}
}

export class TokenString {
	readonly value: string;
	readonly ref: ReferenceRange;

	constructor (raw: string, ref: ReferenceRange) {
		this.value = raw;
		this.ref   = ref;
	}
}



function ParseHex(char: number): number {
	let int = char - 48;
	if (int < 0) return -1;
	if (int > 9) int -= 7;
	if (int < 0) return -1;
	if (int > 15) int -= 32;
	if (int < 0) return -1;

	return int;
}




function ParseName (str: string, cursor: Reference): TokenName | TokenBoolean | null {
	let char = str.charCodeAt(cursor.index);

	if (char < 65)  return null;
	if (char > 122) return null;
	if (90 < char && char < 97 && char !== 95) return null; // gap Z -> a -"_"

	const start = cursor.clone();
	let buffer  = String.fromCharCode(char);

	cursor.advance(false);
	while (cursor.index < str.length) {
		char = str.charCodeAt(cursor.index);
		if (char < 48)  break;
		if (char > 122) break;
		if (57 < char && char < 65)                break; // gap 9 -> a
		if (90 < char && char < 97 && char !== 95) break; // gap Z -> a -"_"

		cursor.advance(false);
		buffer += String.fromCharCode(char);
	}

	const ref = new ReferenceRange(start, cursor.clone());
	if (buffer === "true") return new TokenBoolean(true, ref);
	if (buffer === "false") return new TokenBoolean(false, ref);

	return new TokenName(buffer, ref);
}

function ParseNumber(str: string, cursor: Reference): TokenInteger | null {
	let char = str.charCodeAt(cursor.index);

	let base = char - 48;
	if (base < 0) return null;
	if (base > 9) return null;

	const start = cursor.clone();
	cursor.advance(false);

	while (cursor.index < str.length) {
		char = str.charCodeAt(cursor.index);
		const int = char - 48;
		if (int < 0) break;
		if (int > 9) break;

		base *= 10;
		base += int;
		cursor.advance(false);
	}

	if (cursor.index === str.length) return new TokenInteger(base, new ReferenceRange(start, cursor.clone()));

	char = str.charCodeAt(cursor.index);
	if (char === 120) { // "x"
		if (base != 0) return null;
		cursor.advance(false);

		const s = cursor.index;
		while (cursor.index < str.length) {
			char = str.charCodeAt(cursor.index);

			const int = ParseHex(char);
			if (int < 0) return null;

			base = base << 4;
			base += int;
			cursor.advance(false);
		}
		if (cursor.index === s) return null;

		return new TokenInteger(base, new ReferenceRange(start, cursor.clone()));
	} else if (char === 98) { // "b"
		if (base != 0) return null;
		cursor.advance(false);

		const s = cursor.index;
		while (cursor.index < str.length) {
			char = str.charCodeAt(cursor.index);
			const int = char - 48;
			if (int < 0) break;
			if (int > 1) break;

			base = base << 1;
			base += int;
			cursor.advance(false);
		}
		if (cursor.index === s) return null;

		return new TokenInteger(base, new ReferenceRange(start, cursor.clone()));
	}

	let frac = 0.0;
	if (char === 46) { // "."
		cursor.advance(false);
		let combo = 10;

		const s = cursor.index;
		while (cursor.index < str.length) {
			char = str.charCodeAt(cursor.index);
			const int = char - 48;
			if (int < 0) break;
			if (int > 9) break;

			frac += int / combo;
			combo *= 10;
			cursor.advance(false);
		}
		if (cursor.index === s) return null;
	}

	if (cursor.index !== str.length) {
		char = str.charCodeAt(cursor.index);
		if (char == 101) {
			cursor.advance(false);
			let exponent = 0;

			const s = cursor.index;
			while (cursor.index < str.length) {
				char = str.charCodeAt(cursor.index);
				const int = char - 48;
				if (int < 0) break;
				if (int > 9) break;

				exponent *= 10;
				exponent += int;
				cursor.advance(false);
			}
			if (cursor.index === s) return null;

			frac += base;
			frac *= Math.pow(10, exponent);
			return new TokenFloat(frac, new ReferenceRange(start, cursor.clone()));
		}
	}

	if (frac === 0) return new TokenInteger(base, new ReferenceRange(start, cursor.clone()));
	return new TokenFloat(base+frac, new ReferenceRange(start, cursor.clone()));
}

function ParseString (str: string, cursor: Reference): TokenString | null {
	let char = str.charCodeAt(cursor.index);

	if (char !== 34 && char !== 39) return null;

	const entry = char;
	const start = cursor.clone();
	let buffer  = "";

	let escaping = false;
	cursor.advance(false);
	while (cursor.index < str.length) {
		char = str.charCodeAt(cursor.index);
		if (escaping) {
			if (char === 120) {
				cursor.advance(false);
				escaping = false;

				const s = cursor.index;

				let base = 0;
				for (let i=0; i < 2 && cursor.index < str.length; i++) {
					const char = str.charCodeAt(cursor.index);
					const int = ParseHex(char);
					if (int < 0) return null;

					base = base << 4;
					base += int;
					cursor.advance(false);
				}

				if (cursor.index === s) return null;

				buffer += String.fromCharCode(base);
				continue;
			}


			buffer += String.fromCharCode(char);
			cursor.advance(false);
			escaping = false;
			continue;
		}

		if (char === entry) {
			cursor.advance(false);
			break;
		}

		if (char === 92) { // "\"
			cursor.advance(false);
			escaping = true;
			continue;
		}

		cursor.advance(char === newLine);
		buffer += String.fromCharCode(char);
	}

	return new TokenString(buffer, new ReferenceRange(start, cursor.clone()));
}

export type AnyToken = TokenName | TokenInteger | TokenFloat | TokenBoolean | TokenString;


const newLine  = "\n".charCodeAt(0);
export function ParseTokens (str: string): AnyToken[] | Reference {
	const tokens = new Array<AnyToken>();
	const cursor = new Reference();

	while (cursor.index < str.length) {
		const token = ParseName(str, cursor)
			|| ParseNumber(str, cursor)
			|| ParseString(str, cursor);
		if (!token) return cursor;

		tokens.push(token);
	}

	return tokens;
}


const decoder = new TextDecoder();
export async function ParseTokensOrPanic(file: string): Promise<AnyToken[]> {
	const bytes = await Deno.readFile(file);
	const data = decoder.decode(bytes);

	const res = ParseTokens(data);

	if (Array.isArray(res)) return res;

	console.error(
		`Syntax Error: Unexpected token "${data.slice(res.index, res.index+1)}"\n  `
		+ `at ${colors.cyan("file:///"+file)} ${res.format()}`
	)
	Deno.exit(1);
}