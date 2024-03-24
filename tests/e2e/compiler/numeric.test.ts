/// <reference lib="deno.ns" />
import { fail, assertNotEquals, assert } from "https://deno.land/std@0.201.0/assert/mod.ts";

import * as CompilerFunc from "~/compiler/function.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";
import { FuncRef } from "~/wasm/funcRef.ts";

const source = `
fn left(): f32 {
	return -2.5 % 2.0 * -3.0;
}

fn right(): f32 {
	return 10.0 - 1.0 / 2.0 % 10.0 - 8.0;
}

fn main(): bool {
	// (-2.5 % 2.0) * -3.0 == 10.0 - ((1.0 / 2.0) % 10.0) - 8.0;
	// 1.5 == 1.5
	// true == 1

	// doing this in a single expression to also ensure == is applied correctly
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

	const left = mainFile.namespace["left"];
	assert(left instanceof CompilerFunc.default, "Missing left function");
	left.compile();
	assertNotEquals(left.ref, null, "Left function hasn't compiled");
	project.module.exportFunction("left", left.ref as FuncRef);

	const right = mainFile.namespace["left"];
	assert(right instanceof CompilerFunc.default, "Missing right function");
	right.compile();
	assertNotEquals(right.ref, null, "Right function hasn't compiled");
	project.module.exportFunction("right", right.ref as FuncRef);

	const wasmModule = new WebAssembly.Module(project.module.toBinary());
	const instance = await WebAssembly.instantiate(wasmModule, {});

	const exports = instance.exports;

	// Call the _start function
	let main: () => number = typeof exports._start === "function"
		? exports._start as any
		: fail(`Expected _start to be a function`);

	const code = main() as number;
	if (code === 0) {
		const leftFn: () => number = exports.left as any;
		assert(leftFn instanceof Function, "Missing left function");

		const rightFn: () => number = exports.right as any;
		assert(rightFn instanceof Function, "Missing right function");

		fail(`equivalence checks failed ${leftFn()} != ${rightFn()}`);
	};
});