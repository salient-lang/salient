import { expect } from 'chai';

import { Module, Instruction, Type } from "../../bin/wasm/index.js";

const decoder = new TextDecoder();


describe('Wasm module test', () => {
	const goalText = "Hello, World!" + Math.floor(Math.random()*9);
	it(`should print "${goalText}"`, async () => {
		let mod = new Module();
		const mem = mod.addMemory(1);
		mod.exportMemory("memory", mem);

		const type0 = mod.makeType([Type.Intrinsic.i32], [Type.Intrinsic.i32]);
		const type1 = mod.makeType([Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32], [Type.Intrinsic.i32]);

		const fd_write = mod.importFunction("wasi_snapshot_preview1", "fd_write", type1);

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

			const { exports } = instance;
			memory = exports.memory as any;

			// Check if the _start function exists
			expect(exports).to.have.property('_start').that.is.a('function');

			// Call the _start function
			if (typeof(exports._start) !== "function") throw new Error("Missing start function");
			exports._start();

			// Check stdout
			expect(stdout).to.equal(goalText);

		} catch (err) {
			// If there's an error, the test will fail
			expect.fail(`Failed to run wasm module: ${err}`);
		}

	});
});