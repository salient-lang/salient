// https://webassembly.github.io/spec/core/binary/modules.html

import type { Function } from "./function";
import { FuncRef } from "./funcRef";
import * as Section from "./section/index";
import { Intrinsic } from "./type";
import { Byte } from "./helper";




export default class Module {
	typeSect   : Section.Type;
	importSect : Section.Import;

	funcs: Function[];

	constructor() {
		this.typeSect   = new Section.Type();
		this.importSect = new Section.Import();
		this.funcs = [];
	}

	importFunction(mod: string, name: string, typeIdx: number) {
		const idx = this.importSect.registerFunction(mod, name, typeIdx);

		const ref = new FuncRef(true);
		ref.resolve(idx);

		return ref;
	}

	bindFunction(func: Function) {
		if (this.funcs.includes(func))
			return;

		this.funcs.push(func);
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
		// mem*      : memsec
		// global*   : globalsec
		// export*   : exportsec
		// start?    : startsec
		// elm*      : elmsec
		// m?        : datacountsec
		// code^n    : codesec
		// data^m    : datasec
		// customsec*:

		return new Uint8Array(buffer);
	}
}