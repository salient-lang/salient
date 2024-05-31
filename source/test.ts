/// <reference lib="deno.ns" />

import * as duration from "https://deno.land/std@0.224.0/fmt/duration.ts";
import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import { resolve } from "https://deno.land/std@0.201.0/path/mod.ts";
import { Panic } from "~/compiler/helper.ts";
import TestCase from "~/compiler/test-case.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";

function Duration(start: number, end: number) {
	if (start === end) return "0ms";
	return duration.format(end-start, { ignoreZero: true })
}

export async function Test() {
	// Determine all of the files to test
	const targets = Deno.args.length > 1
		? Deno.args.slice(1)
		: ['.'];

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



	// Compile all of the test cases
	const cwd = resolve("./");
	const project = new Project();
	const mainPck = new Package(project, cwd);

	const index = new Array<TestCase>();

	console.log("Compiling...");
	const compStart = Date.now();
	let testCases = 0;
	for (const path of files.values()) {
		try {
			const file = mainPck.import(path);
			testCases += file.tests.length;

			for (const test of file.tests) {
				try {
					test.compile();
					if (!test.ref) continue;

					project.module.exportFunction(`test${index.length}`, test.ref);
					index.push(test);
				} catch (e) {
					test.evict();
				}
			}
		} catch (e) {
			testCases++;
		}
	}
	const compEnd = Date.now();

	console.log(`\x1b[1A\r`
		+ `Compiled`
		+ ` ${colors.cyan(index.length.toString())} unit tests of ${files.size}`
		+ ` ${colors.gray(`(${Duration(compStart, compEnd)})`)}\n`
	);


	// Run all of the tests
	const wasmModule = new WebAssembly.Module(project.module.toBinary());
	const instance = await WebAssembly.instantiate(wasmModule, {});

	let success = 0;
	const exports = instance.exports;
	let prev = "";
	const execStart = Date.now();
	for (let i=0; i<index.length; i++) {
		const test = index[i];

		if (prev !== test.file.name) {
			prev = test.file.name;
			console.log(colors.gray(prev.replaceAll('\\', '/')));
		}

		const func = exports[`test${i}`];
		if (!func || typeof func !== "function") Panic(
			`${colors.red("Internal Error")}: Test case ${colors.cyan(i.toString())} isn't in wasm module`
		);

		const unitStart  = Date.now();
		let ok = false;
		try {
			const res = func();
			if (res) ok = true;
		} catch (e) { /* no op */ };
		const unitEnd = Date.now();

		console.log(`${ok ? colors.green(" ok") : colors.red("ERR")}`
			+ ` │ ${test.name}`
			+ ` ${colors.gray(`(${Duration(unitStart, unitEnd)})`)}`
		);
		if (ok) success++;
	}
	const execEnd = Date.now();

	const ok = success === testCases;
	console.log(`\n${colors.gray("Final Results")}\n`
		+ `${ok ? colors.green(" ok") : colors.red("ERR")}`
		+ ` │ ${colors.cyan((success).toString())} passed`
		+ ` ${colors.cyan((testCases-success).toString())} failed`
		+ colors.gray(` (${Duration(execStart, execEnd)})`)
	);

	if (project.failed) Deno.exit(1);
}

function RecursiveAdd(folder: string, set: Set<string>) {
	const files = Deno.readDirSync(folder);
	for (const file of files) {
		const path = `${folder}/${file.name}`;
		if (file.isFile && file.name.endsWith(".test.sa")) set.add(path);
		else if (file.isDirectory) RecursiveAdd(path, set);
	}
};
