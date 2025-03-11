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

export class TokenSymbol {
	type: number;
	readonly ref: ReferenceRange;

	constructor (type: number, ref: ReferenceRange) {
		this.type = type;
		this.ref  = ref;
	}

	static not         =   33; // !
	static invert      =   45; // -
	static reference   =   64; // @
	static loan        =   36; // $
	static loanMut     = 3036; // $mut
	static terminal    =   59; // ;
	static spread      = 3046; // ...

	static addition    =   43; // +
	static subtraction =   45; // -
	static multiply    =   42; // *
	static divide      =   47; // /
	static remainder   =   37; // %
	static append      =   44; // ,
	static type        =   58; // :

	static assign   =      61; // =
	static equal    =    2061; // ==
	static same     =    3061; // ===
	static notEqual =    2033; // !=
	static notSame  =    3033; // !==
	static lt       =      60; // <
	static le       =    2060; // <=
	static gt       =      62; // >
	static ge       =    2062; // >=
	static bAnd     =      38; // &
	static bOr      =     124; // |
	static and      =    2038; // &&
	static or       =    2024; // ||

	static member        =   46; // .
	static static        =   35; // #
	static accessStatic  =  235; // #[
	static accessDynamic =   91; // [
	static accessEnd     =   93; // ]
	static blockOpen     =  123; // {
	static blockClose    =  125; // }
	static paramOpen     =   40; // (
	static paramClose    =   41; // )

	static as            = 9001; // as
	static instance      = 9002; // instanceof
	static typeof        = 9003; // typeof

	private static values = new Set(Object.values(TokenSymbol).filter(v => typeof v === 'number') );
	static isValid (type: number) { return this.values.has(type) }
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




function ParseName (str: string, cursor: Reference): TokenName | TokenBoolean | TokenSymbol | null {
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
	if (buffer === "true")       return new TokenBoolean(true,  ref);
	if (buffer === "false")      return new TokenBoolean(false, ref);
	if (buffer === "as")         return new TokenSymbol(TokenSymbol.as,        ref);
	if (buffer === "instanceof") return new TokenSymbol(TokenSymbol.instance,  ref);
	if (buffer === "typeof")     return new TokenSymbol(TokenSymbol.typeof,    ref);

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

function MatchLiteral (str: string, cursor: Reference, match: string): boolean {
	const checkpoint = cursor.clone();
	for (let i=0; i<match.length; i++) {
		if (str[cursor.index] !== match[i]) {
			cursor.infuse(checkpoint);
			return false;
		}

		cursor.advance(str.charCodeAt(cursor.index) === newLine);
	}

	return true;
}

function ParseSymbol (str: string, cursor: Reference): TokenSymbol | null {
	let char = str.charCodeAt(cursor.index);

	if (char < 33) return null;

	const valid = TokenSymbol.isValid(char);
	if (!valid) return null;

	const start = cursor.clone();
	cursor.advance(false);
	const symbol = new TokenSymbol(char, new ReferenceRange(start, cursor.clone()))

	if (symbol.type === TokenSymbol.loan) {
		const hit = MatchLiteral(str, cursor, "mut");

		if (hit) {
			const whiteSpace = SkipWhiteSpace(str, cursor);
			if (whiteSpace) return new TokenSymbol(TokenSymbol.loanMut, new ReferenceRange(start, cursor.clone()));
		}

		cursor.infuse(symbol.ref.end);
	}

	switch (symbol.type) {
		case TokenSymbol.member: {
			for (let i=0; i<2; i++) {
				char = str.charCodeAt(cursor.index + i);
				if (char !== TokenSymbol.member) return symbol;
			}

			cursor.advance(false);
			cursor.advance(false);

			return new TokenSymbol(TokenSymbol.spread, new ReferenceRange(start, cursor.clone()));
		}
		case TokenSymbol.assign: {
			char = str.charCodeAt(cursor.index);
			if (char !== TokenSymbol.assign) return symbol;

			cursor.advance(false);
			char = str.charCodeAt(cursor.index);
			if (char !== TokenSymbol.assign) return new TokenSymbol(TokenSymbol.equal, new ReferenceRange(start, cursor.clone()));

			cursor.advance(false);
			return new TokenSymbol(TokenSymbol.same, new ReferenceRange(start, cursor.clone()));
		}
		case TokenSymbol.not: {
			char = str.charCodeAt(cursor.index);
			if (char !== TokenSymbol.assign) return symbol;

			cursor.advance(false);
			char = str.charCodeAt(cursor.index);
			if (char !== TokenSymbol.assign) return new TokenSymbol(TokenSymbol.notEqual, new ReferenceRange(start, cursor.clone()));

			cursor.advance(false);
			return new TokenSymbol(TokenSymbol.notSame, new ReferenceRange(start, cursor.clone()));
		}
		case TokenSymbol.lt: {
			char = str.charCodeAt(cursor.index);
			if (char !== TokenSymbol.assign) return symbol;

			cursor.advance(false);
			return new TokenSymbol(TokenSymbol.le, new ReferenceRange(start, cursor.clone()));
		}
		case TokenSymbol.gt: {
			char = str.charCodeAt(cursor.index);
			if (char !== TokenSymbol.assign) return symbol;

			cursor.advance(false);
			return new TokenSymbol(TokenSymbol.ge, new ReferenceRange(start, cursor.clone()));
		}
		case TokenSymbol.bAnd: {
			char = str.charCodeAt(cursor.index);
			if (char !== TokenSymbol.bAnd) return symbol;

			cursor.advance(false);
			return new TokenSymbol(TokenSymbol.and, new ReferenceRange(start, cursor.clone()));
		}
		case TokenSymbol.bOr: {
			char = str.charCodeAt(cursor.index);
			if (char !== TokenSymbol.bOr) return symbol;

			cursor.advance(false);
			return new TokenSymbol(TokenSymbol.or, new ReferenceRange(start, cursor.clone()));
		}
		case TokenSymbol.static: {
			char = str.charCodeAt(cursor.index);
			if (char !== TokenSymbol.accessDynamic) return symbol;

			cursor.advance(false);
			return new TokenSymbol(TokenSymbol.accessStatic, new ReferenceRange(start, cursor.clone()));
		}
	}

	return symbol;
}

function SkipWhiteSpace (str: string, cursor: Reference) {
	let char = str.charCodeAt(cursor.index);
	if (char > 32) return false;

	do {
		cursor.advance(char === newLine);
		char = str.charCodeAt(cursor.index);

		break;
	} while (char <= 32);

	return true;
}

export type AnyToken = TokenName | TokenInteger | TokenFloat | TokenBoolean | TokenString | TokenSymbol;


const newLine  = "\n".charCodeAt(0);
export function ParseTokens (str: string): AnyToken[] | Reference {
	const tokens = new Array<AnyToken>();
	const cursor = new Reference();

	while (cursor.index < str.length) {
		const token = ParseName(str, cursor)
			|| ParseNumber(str, cursor)
			|| ParseString(str, cursor)
			|| ParseSymbol(str, cursor);
		if (!token) {
			if (SkipWhiteSpace(str, cursor)) continue;
			return cursor;
		}

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