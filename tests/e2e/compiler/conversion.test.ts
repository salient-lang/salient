import { fail, assertNotEquals, assert } from "https://deno.land/std@0.201.0/assert/mod.ts";

import * as CompilerFunc from "~/compiler/function.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";
import { FuncRef } from "~/wasm/funcRef.ts";

const source = `
fn i64_to_i32(val: i64): i32 {
	return val as i32;
}
fn i32_to_i16(val: i32): i16 {
	return val as i16;
}
fn i32_to_i8(val: i16): i8 {
	return val as i8;
}
fn i64_to_u32(val: i64): u32 {
	return val as u32;
}
fn i32_to_u16(val: i32): u16 {
	return val as u16;
}
fn i32_to_u8(val: i16): u8 {
	return val as u8;
}

// fn f32_to_i32(val: f32): i32 {
// 	return val as i32;
// }
// fn f32_to_i8(val: f32): i8 {
// 	return val as i8;
// }
// fn f64_to_i64(val: f64): i64 {
// 	return val as i64;
// }`;

Deno.test(`Import test`, async () => {
	const project = new Project();
	const mainPck = new Package(project, "./");
	const mainFile = mainPck.importRaw(source);

	const funcNames = [
		"i64_to_i32",
		"i32_to_i16",
		"i32_to_i8",
		"i64_to_u32",
		"i32_to_u16",
		"i32_to_u8",
		// "f32_to_i32",
		// "f32_to_i8",
		// "f64_to_i64"
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

	console.log(funcs.i32_to_u8(300));
	console.log(funcs.i32_to_u8(16));
	console.log(funcs.i32_to_i8(200));
	console.log(funcs.i32_to_i8(120));

	console.log(funcs.i32_to_u16(66_000));
	console.log(funcs.i32_to_u16(65_534));
	console.log(funcs.i32_to_i16(34_767));
	console.log(funcs.i32_to_i16(32_000));

	console.log(funcs.i64_to_u32(17179869184));
	console.log(funcs.i64_to_u32(116));
	console.log(funcs.i64_to_i32(17179869184));
	console.log(funcs.i64_to_i32(120));

	console.log(funcs.i32_to_u16(-2333));
});