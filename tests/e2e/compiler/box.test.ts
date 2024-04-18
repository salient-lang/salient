/// <reference lib="deno.ns" />
import { fail, assertNotEquals, assert } from "https://deno.land/std@0.201.0/assert/mod.ts";

import * as CompilerFunc from "~/compiler/function.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";
import { FuncRef } from "~/wasm/funcRef.ts";

const source = `
struct Box {
	value: i32;
}

external import {
	fn receive(box: Box): none;
	fn send(value: i32): none;
} from "node";

fn main(): none {
	let box: Box = [ none ];
	receive(box);
	send(box.value);

	return;
}`;

Deno.test(`Import test`, async () => {
	const project = new Project();
	const mainPck = new Package(project, "./");
	const mainFile = mainPck.importRaw(source);

	const mainFunc = mainFile.namespace["main"];
	assert(mainFunc instanceof CompilerFunc.default, "Missing main function");
	mainFunc.compile();
	assertNotEquals(mainFunc.ref, null, "Main function hasn't compiled");
	project.module.exportFunction("_start", mainFunc.ref as FuncRef);

	let memory: WebAssembly.Memory;
	let next = 0;
	function receive(ptr: number) {
		next = Math.floor(Math.random()*65536);

		const memoryArray = new Int32Array(memory.buffer);
		memoryArray[ptr/4] = next;

		return;
	}

	let transmit = 0;
	function send(value: number) {
		assert(value === next, "Value miss-match");
		transmit++;
	}

	const wasmModule = new WebAssembly.Module(project.module.toBinary());
	const instance = await WebAssembly.instantiate(wasmModule, {
		node: { receive, send }
	});
	const exports = instance.exports;

	assert(exports.memory instanceof WebAssembly.Memory, `Expected "memory" to be exported`);
	memory = exports.memory;

	// Call the _start function
	let main: () => number = typeof exports._start === "function"
		? exports._start as any
		: fail(`Expected _start to be a function`);

	for (let i=0; i<10; i++) {
		main();
	}
	assert(transmit === 10, "Did not receive all values back");
});