/// <reference lib="deno.ns" />
import { assertNotEquals, assert, assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";

import * as CompilerFunc from "~/compiler/function.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";
import { FuncRef } from "~/wasm/funcRef.ts";

const decoder = new TextDecoder();

Deno.test(`Hello World`, async () => {
	const goalText = "Hello, World!" + Math.floor(Math.random() * 9);

	const project = new Project();
	const mainPck = new Package(project, "./");
	const mainFile = mainPck.importRaw(`
		external import {
			fn fd_write(fd: i32, iovs: i32, iovs_len: i32, nwritten: i32): i32;
		} from "wasix_32v1";

		struct BoxInt {
			value: i32;
		}

		fn main(): i32 {
			// let t: BoxInt = [];
			let a = 42;
			fd_write(1, "${goalText}", 1, "\\x18");

			return 0;
		}`
	);

	{
		const func = mainFile.namespace["main"];
		assert(func instanceof CompilerFunc.default, "Missing main function");
		func.compile();
		assertNotEquals(func.ref, null, "Main function hasn't compiled");
		project.module.exportFunction("main", func.ref as FuncRef);
	}

	let stdout = "";
	let memory: WebAssembly.Memory;
	const imports = {
		wasix_32v1: {
			fd_write: (fd: number, iovs: number, iovs_len: number, n_written: number) => {
				const memoryArray = new Int32Array(memory.buffer);
				const byteArray   = new Uint8Array(memory.buffer);
				for (let iovIdx = 0; iovIdx < iovs_len; iovIdx++) {
					const bufPtr = memoryArray.at(iovs/4 + iovIdx*2) || 0;
					const bufLen = memoryArray.at(iovs/4 + iovIdx*2 + 1) || 0;

					const buffer = byteArray.slice(bufPtr, bufPtr + bufLen);
					stdout += decoder.decode(buffer);
				}
				return 0; // Return 0 to indicate success
			}
		}
	};

	// Load the wasm module
	const wasmModule = new WebAssembly.Module(project.toBinary());

	// Instantiate the wasm module
	const instance = await WebAssembly.instantiate(wasmModule, imports);
	const exports = instance.exports;

	assert(exports.memory instanceof WebAssembly.Memory, `Expected "memory" to be exported`);
	memory = exports.memory;

	assert(typeof exports.main === "function", `Expected "main" function to be exported`);
	const main = exports.main as Function;
	main();

	assertEquals(stdout, goalText);
});