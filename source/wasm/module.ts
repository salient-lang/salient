// https://webassembly.github.io/spec/core/binary/modules.html
import * as Section from "~/wasm/section/index.ts";
import { MemoryRef } from "~/wasm/memoryRef.ts";
import { Intrinsic } from "~/wasm/type.ts";
import { Box, Byte } from "~/helper.ts";
import { Constant } from "~/wasm/instruction/constant.ts";
import { Function } from "~/wasm/function.ts";
import { FuncRef } from "~/wasm/funcRef.ts";
import { GlobalRegister } from "~/wasm/section/global.ts";




export default class Module {
	typeSect   : Section.Type;
	importSect : Section.Import;
	funcSect   : Section.Function;
	memorySect : Section.Memory;
	globalSect : Section.Global;
	exportSect : Section.Export;
	startSect  : Section.Start;
	dataSect   : Section.Data;

	entryFunc : null | FuncRef;

	constructor() {
		this.typeSect   = new Section.Type();
		this.importSect = new Section.Import();
		this.funcSect   = new Section.Function();
		this.memorySect = new Section.Memory();
		this.globalSect = new Section.Global();
		this.exportSect = new Section.Export();
		this.startSect  = new Section.Start();
		this.dataSect   = new Section.Data();
		this.entryFunc  = null;
	}

	addMemory(minPages: number, maxPages?: number): MemoryRef {
		const ref = new MemoryRef(false);
		this.memorySect.addMemory(ref, minPages, maxPages);

		return ref;
	}

	setData(offset: number, data: string | BufferSource) {
		return this.dataSect.setData(offset, data);
	}

	makeType(input: Intrinsic[], output: Intrinsic[]): number {
		return this.typeSect.makeType(input, output);
	}

	makeFunction(input: Intrinsic[], output: Intrinsic[]): Function {
		const type = this.makeType(input, output);
		const func = new Function(type, input.length, output.length);
		this.funcSect.push(func);

		return func;
	}
	removeFunction(func: Function['ref']) {
		this.funcSect.remove(func);
	}

	registerGlobal(type: Intrinsic, mut: boolean, expr: Constant) {
		return this.globalSect.bind(type, mut, expr);
	}

	importFunction(mod: string, name: string, typeIdx: number) {
		return this.importSect.registerFunction(mod, name, typeIdx);
	}

	exportFunction(name: string, func: FuncRef) {
		return this.exportSect.bind(name, func);
	}

	exportGlobal(name: string, global: GlobalRegister) {
		return this.exportSect.bind(name, global);
	}

	exportMemory(name: string, mem: MemoryRef) {
		return this.exportSect.bind(name, mem);
	}

	setEntry(ref: FuncRef) {
		this.entryFunc = ref;
	}

	startFunction(func: FuncRef) {
		return this.startSect.ref = func;
	}

	toBinary() {
		const buffer: Byte[] = [];

		const funcID = new Box<number>(0);

		buffer.push(...[0x00, 0x61, 0x73, 0x6d]);  // PREAMBLE
		buffer.push(...[0x01, 0x00, 0x00, 0x00]);  // WASM_BINARY_VERSION

		buffer.push(...this.typeSect.toBinary());             // functype* : typesec
		buffer.push(...this.importSect.toBinary(funcID));     // imports*  : importsec
		buffer.push(...this.funcSect.headerToBinary(funcID)); // typeidx^n : funcsec
		// table*    : tablesec
		buffer.push(...this.memorySect.toBinary(0)) // mem*    : memsec
		buffer.push(...this.globalSect.toBinary())  // global* : globalsec
		buffer.push(...this.exportSect.toBinary())  // export* : exportsec

		// start?    : startsec
		if (this.entryFunc) buffer.push(...Section.Start.toBinary(this.entryFunc))

		// elm*      : elmsec
		// buffer.push(                                 // m?        : datacountsec
		// 	...Section.DataCount.toBinary(this.dataSect)
		// )

		buffer.push(...this.funcSect.bodyToBinary()); // code^n    : codesec

		buffer.push(...this.dataSect.toBinary())      // data^m    : datasec

		return new Uint8Array(buffer);
	}
}