import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import * as Instance from "~/bnf/syntax.js";
import * as Syntax from "~/bnf/syntax.d.ts";

/// <reference path="~/bnf/shared.d.ts" />
import { ParseError, ReferenceRange, Reference, SyntaxNode } from "~/bnf/shared.js";
import { Panic } from "~/compiler/helper.ts";

await Instance.ready;

export function Parse(data: string, path: string, name: string): Syntax.Term_Program {
	const res = Instance.Parse_Program(data, true);

	if (res instanceof ParseError) Panic(`${colors.red("FATAL ERROR")}: Syntax Parser Completely crashed`);

	if (res.isPartial) {
		console.error(colors.red("Syntax Error"));
		console.error(SourceView(
			path, name,
			res.reach
				? new ReferenceRange(res.root.ref.end, res.reach)
				: ReferenceRange.blank()
		));
		throw new Error("Syntax Error");
	}

	// Fix changes which are too long due to `omit`ed syntax
	RemapRefRange(res.root);

	return res.root as Syntax.Term_Program;
}

function RemapRefRange(syntax: SyntaxNode) {
	if (!Array.isArray(syntax.value)) return;

	const lastI = syntax.value.length - 1;
	if (lastI < 0) return;

	for (const child of syntax.value) {
		RemapRefRange(child);
	}

	syntax.ref.end = syntax.value[lastI].ref.end;

	return;
}




export function SourceView(path: string, name: string, range: ReferenceRange, compact?: boolean) {
	return range.start.line == range.end.line
		? SingleLine(path, name, range, compact)
		: MultiLine(path, name, range, compact);
}

function SingleLine(path: string, name: string, range: ReferenceRange, compact?: boolean) {
	const offset = Math.max(0, range.start.index - 200);
	const slice = ReadByteRange(path, offset, range.end.index+200);
	if (slice === null) return `${name}: ${range.toString()}\n`;

	let s = slice.lastIndexOf("\n", range.start.index-offset);
	if (s === -1) s = 0;
	let e = slice.indexOf("\n", range.end.index-offset);
	if (e === -1) e = slice.length;

	let line = slice.slice(s, e).trimEnd();
	let pad = line.length;
	line = line.trimStart();
	pad -= line.length;

	const margin = ` ${range.start.line} │ `;
	const underline = "\n"
		+ " ".repeat(margin.length + range.start.col - pad)
		+ "^".repeat(Math.max(1, range.end.col - range.start.col))
		+ "\n";

	const body = margin + line + underline;
	return compact ? body : `${body}  ${name}: ${range.toString()}\n`;
}

function MultiLine(path: string, name: string, range: ReferenceRange, compact?: boolean) {
	const offset = Math.max(0, range.start.index - 200);
	const slice = ReadByteRange(path, offset, range.end.index+200);
	if (slice === null) return `${name}: ${range.toString()}\n`;

	let s = slice.lastIndexOf("\n", range.start.index-offset);
	if (s === -1) s = 0;
	else s ++;
	let e = slice.indexOf("\n", range.end.index-offset);
	if (e === -1) e = slice.length;

	const lines = slice.slice(s, e).split("\n");
	const digits = Math.floor(Math.log10(range.end.line)) + 1;

	let maxLen = 0;
	function RenderLine(line: string, lnOff: number,) {
		const ln = lnOff + range.start.line;
		const src = line.replaceAll("\t", "  ");
		maxLen = Math.max(src.length, maxLen);
		return ` ${ln.toString().padStart(digits, " ")} │ ${src}\n`;
	}

	// TODO: Low priority
	// This currently does not strip any padding
	// So if every line in the section is indented by 4 space, that will remain
	//
	// Ideally it should calculate the minimum indentation in the snippet
	// Then back shift based on that

	let body = "";
	if (lines.length <= 5) {
		body += lines.map(RenderLine).join("");
	} else {
		let begin = "";
		for (let i=0; i<2; i++) {
			begin += RenderLine(lines[i], i);
		}

		let end = "";
		for (let i=lines.length-2; i<lines.length; i++) {
			end += RenderLine(lines[i], i);
		}

		body += begin
			+ ` ${" ".repeat(digits)} │${"░".repeat(maxLen+3)}\n`
			+ end;
	}

	return compact ? body : body + `\n  ${name} ${range.toString()}\n`;
}


function ReadByteRange(path: string, start: number, end: number): string | null {
	// Ensure end byte is not before the start byte
	if (end < start) throw new Error('End byte should be greater than start byte');

	start = Math.max(0, start);

	// Open the file for reading
	try {
		const file = Deno.openSync(path, { read: true });

		const bufferSize = end - start + 1;
		const buffer = new Uint8Array(bufferSize);

		// Position the file cursor to the start byte
		file.seekSync(start, Deno.SeekMode.Start);

		// Read the specified byte range into the buffer
		file.readSync(buffer);

		// Close the file
		file.close();

		// Convert Uint8Array to string
		const decoder = new TextDecoder();
		return decoder.decode(buffer);
	} catch (e) {
		return null;
	}
}


export {
	ReferenceRange, Reference,
	ParseError,
	Syntax
}