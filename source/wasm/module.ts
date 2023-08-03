// https://webassembly.github.io/spec/core/binary/modules.html

import { Function } from "./function";
import { FuncRef } from "./funcRef";
import * as Section from "./section/index";
import { Intrinsic } from "./type";
import { Byte } from "./helper";
import { MemoryRef } from "./memoryRef";




export default class Module {
	typeSect   : Section.Type;
	importSect : Section.Import;
	memorySect : Section.Memory;
	exportSect : Section.Export;
	dataSect   : Section.Data;

	entryFunc : null | FuncRef;

	funcs: Function[];

	constructor() {
		this.typeSect   = new Section.Type();
		this.importSect = new Section.Import();
		this.memorySect = new Section.Memory();
		this.exportSect = new Section.Export();
		this.dataSect   = new Section.Data();
		this.entryFunc = null;
		this.funcs = [];
	}

	importFunction(mod: string, name: string, typeIdx: number) {
		const idx = this.importSect.registerFunction(mod, name, typeIdx);

		const ref = new FuncRef(true);
		ref.resolve(idx);

		return ref;
	}

	exportFunction(name: string, func: FuncRef) {
		return this.exportSect.bind(name, func);
	}

	exportMemory(name: string, mem: MemoryRef) {
		return this.exportSect.bind(name, mem);
	}

	addMemory(minPages: number, maxPages?: number): MemoryRef {
		const ref = new MemoryRef(false);
		this.memorySect.addMemory(ref, minPages, maxPages);

		return ref;
	}

	setData(offset: number, data: string | BufferSource) {
		return this.dataSect.setData(offset, data);
	}

	makeFunction(input: Intrinsic[], output: Intrinsic[]): Function {
		const type = this.makeType(input, output);
		const func = new Function(type, input.length, output.length);
		this.bindFunction(func);

		return func;
	}

	bindFunction(func: Function) {
		if (this.funcs.includes(func))
			return;

		this.funcs.push(func);
	}
	setEntry(ref: FuncRef) {
		this.entryFunc = ref;
	}

	unbindFunction(func: Function) {
		const index = this.funcs.indexOf(func);
		if (index == -1) return;

		this.funcs.splice(index, 1);
	}

	makeType(input: Intrinsic[], output: Intrinsic[]): number {
		return this.typeSect.makeType(input, output);
	}

	toBinary() {
		const buffer: Byte[] = [];

		buffer.push(...[0x00, 0x61, 0x73, 0x6d]);    // PREAMBLE
		buffer.push(...[0x01, 0x00, 0x00, 0x00]);    // WASM_BINARY_VERSION
		buffer.push(...this.typeSect.toBinary());    // functype* : typesec
		buffer.push(...this.importSect.toBinary());  // imports*  : importsec
		buffer.push(                                 // typeidx^n : funcsec
			...Section.Function.toBinary(
				this.importSect.getFuncs(),
				this.funcs
			)
		);
		// table*    : tablesec
		buffer.push(...this.memorySect.toBinary(0))  // mem*      : memsec
		// global*   : globalsec
		buffer.push(...this.exportSect.toBinary())   // export*   : exportsec

		if (this.entryFunc) {
			buffer.push(                               // start?    : startsec
				...Section.Start.toBinary(this.entryFunc)
			)
		}
		// elm*      : elmsec
		// buffer.push(                                 // m?        : datacountsec
		// 	...Section.DataCount.toBinary(this.dataSect)
		// )

		buffer.push(                                 // code^n    : codesec
			...Section.Code.toBinary(this.funcs)
		);

		// buffer.push(...this.dataSect.toBinary())      // data^m    : datasec

		return new Uint8Array(buffer);
	}
}