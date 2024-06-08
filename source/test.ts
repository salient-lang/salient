/// <reference lib="deno.ns" />

import * as duration from "https://deno.land/std@0.224.0/fmt/duration.ts";
import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import TestCase from "~/compiler/test-case.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";
import { StrippedAnsiPadEnd, Sum, Table } from "~/helper.ts";
import { resolve } from "https://deno.land/std@0.201.0/path/mod.ts";
import { Panic } from "~/compiler/helper.ts";

function Duration(milliseconds: number) {
	if (milliseconds == 0) return "0ms";
	return duration.format(milliseconds, { ignoreZero: true });
}

export async function Test() {
	const files = GetTargets();

	// Compile all of the test cases
	const cwd = resolve("./");
	const project = new Project();
	const mainPck = new Package(project, cwd);

	const start = Date.now();
	const compilation = CompileTests(files, mainPck);
	const execution = await RunTests(project, compilation.index);
	const duration = Date.now() - start;

	const ok = compilation.ok && execution.ok;
	const status = ok ? colors.green("ok") : colors.red("ERR");
	console.log(`Overall ${status} ${colors.gray(`(${Duration(duration)})`)}`);

	if (project.failed) Deno.exit(1);
}

function GetTargets(): Set<string> {
	// Determine all of the files to test
	const targets = Deno.args.length > 1
		? Deno.args.slice(1)
		: ['.'];

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

	console.log(`Crawled ${colors.cyan(files.size.toString())} files ${colors.gray(`(${Duration(duration)})`)}\n`);

	return files;
}

function CompileTests(files: Set<string>, mainPck: Package) {
	const index = new Array<TestCase>();

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
			const file = mainPck.import(path);
			parseTime += file.parseTime;
			tests = file.tests.length;
			filesPassed++;

			const start = Date.now();
			for (const test of file.tests) {
				try {
					test.compile();
					if (!test.ref) continue;

					mainPck.project.module.exportFunction(`test${index.length}`, test.ref);
					index.push(test);
					testSuccess++;
					pass++;
				} catch (e) {
					testFail++;
					test.evict();
					errs.push(e);
					ok = false;
				}
			}
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
	console.log("Parse/Compile".padEnd(widths[0] + widths[1] + 5) + "Unit".padEnd(widths[2]+4) + "Time")
	console.log(body);

	const ok = testFail === 0;
	const status = ( ok ? colors.green(" ok  ") : colors.red("ERR  ") )
		+ " Compiled"
		+ ` ${colors.cyan(testSuccess.toString())} passed`
		+ ` ${colors.cyan(testFail.toString())} failed`;
	console.log(
		StrippedAnsiPadEnd(status, Sum(widths) - widths[3] + 9)
		+ colors.gray(
			`(${Duration(duration)})\n`
			+ `      Parsing ${Duration(parseTime)}\n`
			+ `      Compile ${Duration(compTime)}\n`
		)
	);

	if (errs.length > 0) {
		console.log(`\n\n${colors.red("Compilation Errors")}:`)
		for (const err in errs) {
			console.error(err);
		}
	}

	return { ok, index, };
}

async function RunTests(project: Project, index: TestCase[]) {
	// Run all of the tests
	const wasmModule = new WebAssembly.Module(project.module.toBinary());
	const instance = await WebAssembly.instantiate(wasmModule, {});

	const table: string[][] = [];

	let success = 0;
	const exports = instance.exports;
	let prev = "";
	let duration = 0;
	for (let i=0; i<index.length; i++) {
		const test = index[i];

		if (prev !== test.file.name) {
			prev = test.file.name;
			table.push([
				"",
				colors.gray(prev.replaceAll('\\', '/')),
				""
			]);
		}

		const func = exports[`test${i}`];
		if (!func || typeof func !== "function") Panic(
			`${colors.red("Internal Error")}: Test case ${colors.cyan(i.toString())} isn't in wasm module`
		);

		const start = Date.now();
		let ok = false;
		try {
			const res = func();
			if (res) ok = true;
		} catch (e) { /* no op */ };
		const unitTime = Date.now()-start;

		duration += unitTime;

		table.push([
			ok ? colors.green(" ok") : colors.red("ERR"),
			test.name,
			colors.gray(`(${Duration(unitTime)})`)
		])
		if (ok) success++;
	}

	const { widths, body } = Table(table);
	console.log(" Test".padEnd(widths[0] + widths[1] + 6) + "Time")
	console.log(body);

	const ok = (success === index.length);
	const status = ( ok ? colors.green(" ok  ") : colors.red("ERR  ") )
		+ " Ran"
		+ ` ${colors.cyan((success).toString())} passed`
		+ ` ${colors.cyan((index.length-success).toString())} failed`;

	console.log(
		StrippedAnsiPadEnd(status, widths[0] + widths[1] + 6)
		+ colors.gray(`(${Duration(duration)})\n`)
	);

	return { ok };
}


function RecursiveAdd(folder: string, set: Set<string>) {
	const files = Deno.readDirSync(folder);
	for (const file of files) {
		const path = `${folder}/${file.name}`;
		if (file.isFile && file.name.endsWith(".test.sa")) set.add(path);
		else if (file.isDirectory) RecursiveAdd(path, set);
	}
};
