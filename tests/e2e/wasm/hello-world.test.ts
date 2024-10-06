import { fail, assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";

import { Module, Instruction, Type } from "~/wasm/index.ts";

const decoder = new TextDecoder();

const goalText = "Hello, World!" + Math.floor(Math.random() * 9);

Deno.test(`Wasm module test: should print "${goalText}"`, async () => {
	let mod = new Module();
	const mem = mod.addMemory(1);
	mod.exportMemory("memory", mem);

	const type1 = mod.makeType([Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32], [Type.Intrinsic.i32]);

	const fd_write = mod.importFunction("wasi_snapshot_preview1", "fd_write", type1);
	if (fd_write === null) fail(`Unable to import fd_write`);

	mod.setData(0, goalText);
	// The WASI iovec struct, which consists of a pointer to
	// the data and the length of the data.
	// This starts at address 100, to leave some room after the string data.
	mod.setData(16, "\x00\x00\x00\x00\x0e\x00\x00\x00"); // Set pointer to 0 and length to 14

	const main = mod.makeFunction([], []);
	main.code.push(Instruction.const.i32(1));   // File descriptor for stdout
	main.code.push(Instruction.const.i32(16));  // iovec array
	main.code.push(Instruction.const.i32(1));   // number of iovec structs
	main.code.push(Instruction.const.i32(0));   // address to store number of bytes written (ignoring it here)
	main.code.push(Instruction.call(fd_write));
	main.code.push(Instruction.drop());

	const extra = mod.makeFunction([Type.Intrinsic.i32], [Type.Intrinsic.i32]);
	extra.code.push(Instruction.local.get(0));
	extra.code.push(Instruction.return());

	mod.exportFunction("_start", main.ref);

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
	const wasmModule = new WebAssembly.Module(mod.toBinary());

	try {
		// Instantiate the wasm module
		const instance = await WebAssembly.instantiate(wasmModule, imports);

		const exports = instance.exports;
		memory = exports.memory as WebAssembly.Memory;

		// Call the _start function
		if (typeof exports._start === "function") {
			(exports._start as Function)();
		} else {
			fail(`Expected _start to be a function`);
		}

		// Check stdout
		assertEquals(stdout, goalText);

	} catch (err) {
		// If there's an error, the test will fail
		fail(`Failed to run wasm module: ${err}`);
	}

});