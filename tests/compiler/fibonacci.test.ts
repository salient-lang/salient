/// <reference lib="deno.ns" />
import { fail, assertNotEquals, assert, assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";

import * as CompilerFunc from "~/compiler/function.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";
import { FuncRef } from "~/wasm/funcRef.ts";

Deno.test(`Signed integer Fibonacci test`, async () => {
	const project = new Project();
	const mainPck = new Package(project, "./");
	const mainFile = mainPck.importRaw(`
		fn fib_recur(n: i32): i32 {
			if n <= 1 return n;
			return fib_recur(n - 1) + fib_recur(n - 2);
		}

		fn fib_tail(n: i32, a: i32, b: i32): i32 {
			return if n <= 0 a else fib_tail(n - 1, b, a + b);
		}`
	);

	{
		const func = mainFile.namespace["fib_tail"];
		assert(func instanceof CompilerFunc.default, "Missing fib_tail function");
		func.compile();
		assertNotEquals(func.ref, null, "Main function hasn't compiled");
		project.module.exportFunction("fib_tail", func.ref as FuncRef);
	}

	{
		const func = mainFile.namespace["fib_recur"];
		assert(func instanceof CompilerFunc.default, "Missing recursive fibonacci function");
		func.compile();
		assertNotEquals(func.ref, null, "Main function hasn't compiled");
		project.module.exportFunction("fib_recur", func.ref as FuncRef);
	}

	// Load the wasm module
	const wasmModule = new WebAssembly.Module(project.module.toBinary());

	try {
		// Instantiate the wasm module
		const instance = await WebAssembly.instantiate(wasmModule, {});
		const exports = instance.exports;

		console.time("Recursive fibonacci");
		if (typeof exports.fib_recur === "function") {
			const fib_recur = exports.fib_recur as Function;
			assertEquals(fib_recur(3), 2);
			assertEquals(fib_recur(4), 3);
			assertEquals(fib_recur(5), 5);
			assertEquals(fib_recur(6), 8);
			assertEquals(fib_recur(24), 46368);
			assertEquals(fib_recur(46), 1836311903);
		}
		console.timeEnd("Recursive fibonacci");

		console.time("Tail call fibonacci");
		if (typeof exports.fib_tail === "function") {
			const fib_tail = exports.fib_tail as Function;
			assertEquals(fib_tail(3, 0, 1), 2);
			assertEquals(fib_tail(4, 0, 1), 3);
			assertEquals(fib_tail(5, 0, 1), 5);
			assertEquals(fib_tail(6, 0, 1), 8);
			assertEquals(fib_tail(24, 0, 1), 46368);
			assertEquals(fib_tail(46, 0, 1), 1836311903);
		} else {
			fail(`Expected fib_tail to be a function`);
		}
		console.timeEnd("Tail call fibonacci");

	} catch (err) {
		// If there's an error, the test will fail
		fail(`Failed to run wasm module: ${err}`);
	}
});