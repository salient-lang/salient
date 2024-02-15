/// <reference lib="deno.ns" />
import { fail, assertEquals, assertNotEquals, assert } from "https://deno.land/std@0.201.0/assert/mod.ts";

import * as CompilerFunc from "~/compiler/function.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";
import { FuncRef } from "~/wasm/funcRef.ts";

const decoder = new TextDecoder();

const goalStdout = "";

const source = `
fn main(): f32 {
	return -3.5 % 2.0;
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

	let stdout = "";

	let memory: WebAssembly.Memory;

	const imports = {
		wasi_snapshot_preview1: {
			fd_write: (fd: number, iovs: number, iovs_len: number, n_written: number) => {
				const memoryArray = new Int32Array(memory.buffer);
				const byteArray   = new Uint8Array(memory.buffer);
				for (let iovIdx = 0; iovIdx < iovs_len; iovIdx++) {
					const bufPtr = memoryArray.at(iovs/4 + iovIdx*2) || 0;
					const bufLen = memoryArray.at(iovs/4 + iovIdx*2 + 1) || 0;
					const data = decoder.decode(byteArray.slice(bufPtr, bufPtr + bufLen));
					stdout += data;
				}
				return 0; // Return 0 to indicate success
			}
		}
	};

	// Load the wasm module
	const wasmModule = new WebAssembly.Module(project.module.toBinary());

	try {
		// Instantiate the wasm module
		const instance = await WebAssembly.instantiate(wasmModule, imports);

		const exports = instance.exports;
		memory = exports.memory as WebAssembly.Memory;

		// Call the _start function
		if (typeof exports._start === "function") {
			const out = (exports._start as Function)() as any;
		} else {
			fail(`Expected _start to be a function`);
		}

		// Check stdout
		assertEquals(stdout, goalStdout);

	} catch (err) {
		// If there's an error, the test will fail
		fail(`Failed to run wasm module: ${err}`);
	}

});