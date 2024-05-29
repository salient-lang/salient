/// <reference lib="deno.ns" />

import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import { resolve } from "https://deno.land/std@0.201.0/path/mod.ts";
import { Panic } from "~/compiler/helper.ts";
import TestCase from "~/compiler/test-case.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";



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
	for (const path of files.values()) {
		const file = mainPck.import(path);

		for (const test of file.tests) {
			test.compile();
			if (test.ref) project.module.exportFunction(`test${index.length}`, test.ref);

			index.push(test);
		}
	}

	if (project.failed) Deno.exit(1);




	// Run all of the tests
	const wasmModule = new WebAssembly.Module(project.module.toBinary());
	const instance = await WebAssembly.instantiate(wasmModule, {});

	let fails = 0;
	const exports = instance.exports;
	let prev = "";
	const start = Date.now();
	for (let i=0; i<index.length; i++) {
		const test = index[i];

		if (prev !== test.file.name) {
			prev = test.file.name;
			console.log("\n"+colors.gray(prev));
		}

		const func = exports[`test${i}`];
		if (!func || typeof func !== "function") Panic(
			`${colors.red("Internal Error")}: Test case ${colors.cyan(i.toString())} isn't in wasm module`
		);

		const unitStart  = Date.now();
		const result = func();
		const unitEnd    = Date.now();
		console.log(`  - ${result ? colors.green("ok") : colors.red("FAIL")}`
			+ ` ${test.name}`
			+ ` ${colors.gray(`(${unitEnd-unitStart}ms)`)}`
		);
		if (!result) fails++;
	}
	const end = Date.now();

	console.log(`\n ${fails == 0 ? colors.green("ok") : colors.red("FAIL")}`
		+ ` | ${index.length-fails} passed`
		+ ` | ${fails} failed`
		+ colors.gray(` (${end-start}ms)`)
	);
}

function RecursiveAdd(folder: string, set: Set<string>) {
	const files = Deno.readDirSync(folder);
	for (const file of files) {
		const path = `${folder}/${file.name}`;
		if (file.isFile && file.name.endsWith(".test.sa")) set.add(path);
		else if (file.isDirectory) RecursiveAdd(path, set);
	}
};
