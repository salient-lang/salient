import { assertEquals } from "https://deno.land/std@0.201.0/assert/assert_equals.ts";
import { assertNotEquals, assert } from "https://deno.land/std@0.201.0/assert/mod.ts";

import * as CompilerFunc from "~/compiler/function.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";
import { FuncRef } from "~/wasm/funcRef.ts";

const source = `
fn i32_to_u8(val: i16): u8 {
	return val as u8;
}
fn i32_to_i8(val: i16): i8 {
	return val as i8;
}
fn i32_to_u16(val: i32): u16 {
	return val as u16;
}
fn i32_to_i16(val: i32): i16 {
	return val as i16;
}`;

Deno.test(`Import test`, async () => {
	const project = new Project();
	const mainPck = new Package(project, "./");
	const mainFile = mainPck.importRaw(source);

	const funcNames = [
		"i32_to_u8",
		"i32_to_i8",
		"i32_to_u16",
		"i32_to_i16",
	]
	for (const funcName of funcNames) {
		const func = mainFile.namespace[funcName];
		assert(func instanceof CompilerFunc.default, `Missing ${funcName} function`);
		func.compile();
		assertNotEquals(func.ref, null, `Function ${funcName} failed to compile`);
		project.module.exportFunction(funcName, func.ref as FuncRef);
	}

	const wasmModule = new WebAssembly.Module(project.module.toBinary());
	const instance = await WebAssembly.instantiate(wasmModule);
	const exports = instance.exports;

	const funcs: {
		[key: string]: (val: number) => number
	} = {};
	for (const name of funcNames) {
		assert(typeof exports[name] === "function", `Missing ${name} function in wasm module`);
		funcs[name] = exports[name] as (val: number) => number;
	}

	assertEquals(funcs.i32_to_u8(300), 255);
	assertEquals(funcs.i32_to_u8( 16),  16);
	assertEquals(funcs.i32_to_i8(200), 127);
	assertEquals(funcs.i32_to_i8(120), 120);

	assertEquals(funcs.i32_to_u8(-300),    0);
	assertEquals(funcs.i32_to_u8(-16),     0);
	assertEquals(funcs.i32_to_i8(-200), -128);
	assertEquals(funcs.i32_to_i8(-120), -120);
});