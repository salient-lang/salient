/// <reference lib="deno.ns" />
import { fail, assertNotEquals, assert } from "https://deno.land/std@0.201.0/assert/mod.ts";

import * as CompilerFunc from "~/compiler/function.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";
import { FuncRef } from "~/wasm/funcRef.ts";

const source = `
fn main(): bool {
	// (-2.5 % 2.0) * -3.0 == 10.0 - ((1.0 / 2.0) % 10.0) - 8.0;
	// 1.5 == 1.5
	// true == 1
	return -2.5 % 2.0 * -3.0 == 10.0 - 1.0 / 2.0 % 10.0 - 8.0;
}`;

Deno.test(`Numeric logic test`, async () => {
	const project = new Project();
	const mainPck = new Package(project, "./");
	const mainFile = mainPck.importRaw(source);


	const mainFunc = mainFile.namespace["main"];
	assert(mainFunc instanceof CompilerFunc.default, "Missing main function");
	mainFunc.compile();
	assertNotEquals(mainFunc.ref, null, "Main function hasn't compiled");
	project.module.exportFunction("_start", mainFunc.ref as FuncRef);

	const wasmModule = new WebAssembly.Module(project.module.toBinary());
	const instance = await WebAssembly.instantiate(wasmModule, {});

	const exports = instance.exports;

	// Call the _start function
	let main: () => number = typeof exports._start === "function"
		? exports._start as any
		: fail(`Expected _start to be a function`);

	const code = main() as number;
	if (code === 0) fail(`equivalence checks failed`);

});