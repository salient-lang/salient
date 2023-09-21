/// <reference lib="deno.ns" />
import { fail, assertNotEquals, assert, assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";
import * as CompilerFunc from "../../source/compiler/function.ts";
import Project from "../../source/compiler/project.ts";
import { FuncRef } from "../../source/wasm/funcRef.ts";

Deno.test(`Signed integer Fibonacci test`, async () => {
	const project = new Project("./");
	const mainFile = project.importRaw(`
		fn fibonacci(n: i32): i32 {
			return fibonacci_tail(n, 0, 1);
		}

		fn fibonacci_tail(n: i32, a: i32, b: i32): i32 {
			if (n <= 0) return a;
			return fibonacci_tail(n - 1, b, a + b);
		}`
	);

	const mainFunc = mainFile.namespace["fibonacci"];
	assert(mainFunc instanceof CompilerFunc.default, "Missing main function");
	mainFunc.compile();
	assertNotEquals(mainFunc.ref, null, "Main function hasn't compiled");
	project.module.exportFunction("fibonacci", mainFunc.ref as FuncRef);

	// Load the wasm module
	const wasmModule = new WebAssembly.Module(project.module.toBinary());

	try {
		// Instantiate the wasm module
		const instance = await WebAssembly.instantiate(wasmModule, {});
		const exports = instance.exports;

		// Call the _start function
		if (typeof exports.fibonacci === "function") {
			const fibonacci = exports.fibonacci as Function;
			assertEquals(fibonacci(3), 2);
			assertEquals(fibonacci(4), 3);
			assertEquals(fibonacci(5), 5);
			assertEquals(fibonacci(6), 8);
			assertEquals(fibonacci(24), 46368);
			assertEquals(fibonacci(46), 1836311903);
		} else {
			fail(`Expected fibonacci to be a function`);
		}

	} catch (err) {
		// If there's an error, the test will fail
		fail(`Failed to run wasm module: ${err}`);
	}
});