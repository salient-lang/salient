import * as duration from "https://deno.land/std@0.224.0/fmt/duration.ts";
import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import { StrippedAnsiPadEnd, Sum, Table } from "~/helper.ts";
import { Panic } from "~/compiler/helper.ts";
import { ParseTokens } from "~/parser/tokenizer.ts";
import { Reference } from "~/parser.ts";

function Duration(milliseconds: number) {
	if (milliseconds == 0) return "0ms";
	return duration.format(milliseconds, { ignoreZero: true });
}

function GetTargets(): Set<string> {
	// Determine all of the files to test
	const targets = ["./tests"];

	const start = Date.now();
	const files = new Set<string>();
	for (const t of targets) {
		const stats = Deno.statSync(t);
		if (stats.isFile) {
			if (!t.endsWith(".test.sa")) Panic(
				`${colors.red("Error")}: Provided file ${colors.cyan(t)} isn't a test.sa file`
			);

			files.add(t);
		} else if (stats.isDirectory) RecursiveAdd(t, files);
	}
	const duration = Date.now() - start;

	console.info(`Crawled ${colors.cyan(files.size.toString())} files\n`);

	return files;
}

function RecursiveAdd(folder: string, set: Set<string>) {
	const files = Deno.readDirSync(folder);
	for (const file of files) {
		const path = `${folder}/${file.name}`;
		if (file.isFile && file.name.endsWith(".test.sa")) set.add(path);
		else if (file.isDirectory) RecursiveAdd(path, set);
	}
};

async function CompileTests(files: Set<string>) {

	const errs: Error[] = [];
	let filesPassed = 0;
	let testSuccess = 0;
	let testFail = 0;


	const table: string[][] = [];
	let parseTime = 0;
	let compTime = 0;
	const start = Date.now();
	for (const path of files.values()) {
		let tests = 1;
		let pass = 0;
		let ok = true;

		let unitTime = 0;
		try {
			const decoder = new TextDecoder();
			const bytes = await Deno.readFile(path);
			const data = decoder.decode(bytes);

			const start = Date.now();
			const res = ParseTokens(data);
			if (res instanceof Reference) throw new Error(res.toString());
			parseTime += Date.now() - start;

			filesPassed++;

			unitTime = Date.now() - start;
			compTime += unitTime;
		} catch (e) {
			testFail++;
			ok = false;
		}

		table.push([
			ok ? colors.green(" ok") : colors.red("ERR"),
			path,
			`${colors.cyan(pass.toString())}/${colors.cyan(tests.toString())}`,
			colors.gray(`${Duration(parseTime)}/${Duration(unitTime)}`)
		]);
	}
	const duration = Date.now() - start;

	const { widths, body } = Table(table);
	console.info("Parse/Compile".padEnd(widths[0] + widths[1] + 5) + "Unit".padEnd(widths[2]+4) + "Time")
	console.info(body);

	const ok = testFail === 0;
	const status = ( ok ? colors.green(" ok  ") : colors.red("ERR  ") )
		+ " Compiled"
		+ ` ${colors.cyan(testSuccess.toString())} passed`
		+ ` ${colors.cyan(testFail.toString())} failed`;
	console.info(
		StrippedAnsiPadEnd(status, Sum(widths) - widths[3] + 9)
		+ colors.gray(
			`(${Duration(duration)})\n`
			+ `      Parsing ${Duration(parseTime)}\n`
			+ `      Compile ${Duration(compTime)}\n`
		)
	);

	if (errs.length > 0) {
		console.info(`\n\n${colors.red("Compilation Errors")}:`)
		for (const err in errs) {
			console.error(err);
		}
	}

	return { ok };
}



CompileTests(GetTargets());