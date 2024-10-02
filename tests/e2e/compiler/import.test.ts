import { fail, assertEquals, assertNotEquals, assert } from "https://deno.land/std@0.201.0/assert/mod.ts";

import * as CompilerFunc from "~/compiler/function.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";
import { FuncRef } from "~/wasm/funcRef.ts";

const source = `
external import {
	fn randInt(): i32;
} from "node";

fn main(): i32 {
	return randInt() + 2;
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

	let next = 0;
	function randInt() {
		next = Math.floor(Math.random()*65536);
		return next;
	}

	const wasmModule = new WebAssembly.Module(project.module.toBinary());
	const instance = await WebAssembly.instantiate(wasmModule, {
		node: { randInt }
	});
	const exports = instance.exports;

	// Call the _start function
	let main: () => number = typeof exports._start === "function"
		? exports._start as any
		: fail(`Expected _start to be a function`);

	for (let i=0; i<10; i++) {
		const res = main();
		assertEquals(res, next + 2)
	}
});