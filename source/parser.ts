import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import { ParseError, ReferenceRange, Reference } from "./bnf/shared.js";
import * as Instance from "./bnf/syntax.js";
import * as Syntax from "./bnf/syntax.d.ts";
import { Yeet } from "./helper.ts";

await Instance.ready;

export function Parse(data: string, path: string, name: string): Syntax.Term_Program {
	const res = Instance.Parse_Program(data, true);

	if (res instanceof ParseError) Yeet(`${colors.red("FATAL ERROR")}: Syntax Parser Completely crashed`);

	if (res.isPartial) Yeet(
		colors.red("Syntax Error") + "\n",
		{
			path, name,
			ref: res.reach
				? new ReferenceRange(res.root.ref.end, res.reach)
				: ReferenceRange.blank()
		}
	);

	return res.root as Syntax.Term_Program;
}

export function SourceView(path: string, name: string, range: ReferenceRange) {
	const source = ReadByteRange(path, range.start.index-200, range.end.index+200);
	if (source === null) return `${name}: ${range.toString()}\n`;

	const begin = ExtractLine(source, range.start).replace(/\t/g, "  ");
	let body = "";

	if (range.start.line === range.end.line) {
		const margin = ` ${range.start.line} | `;

		const trimmed = begin.trim();
		const trimDiff = begin.length - trimmed.length;

		const underline = "\n"
			+ " ".repeat(margin.length + range.start.col - trimDiff)
			+ "^".repeat(Math.max(1, range.end.col - range.start.col));

		body = margin + trimmed + underline;
	} else {
		const eLine = " " + range.end.line.toString();
		const sLine = range.start.line.toString().padStart(eLine.length, " ");

		const finish = ExtractLine(source, range.end).replace(/\t/g, "  ");;

		body = sLine + " | " + begin + "\n"
			+ eLine + " | " + finish;
	}

	body += `\n  ${name}: ${range.toString()}\n`;

	return body;
}

function ExtractLine(source: string, ref: Reference) {
	const begin = FindNewLine(source, ref.index, -1);
	const end   = FindNewLine(source, ref.index, 1);

	return source.slice(begin, end);
}

function FindNewLine(source: string, index: number, step: number) {
	index += step;

	while (index >= 0 && index < source.length && source[index] !== "\n") {
		index += step;
	}

	if (source[index] === "\n") {
		index -= step;
	}

	return Math.max(index, 0);
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