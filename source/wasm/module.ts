// https://webassembly.github.io/spec/core/binary/modules.html

import * as Section from "./section/index";
import { Intrinsic } from "./type";




export default class Module {
	typeSect  : Section.Type;
	importSect: Section.Import;
	funcSect  : Section.Function;

	constructor() {
		this.typeSect   = new Section.Type();
		this.importSect = new Section.Import();
		this.funcSect   = new Section.Function();
	}

	importFunction(mod: string, name: string, typeIdx: number) {
		return this.importSect.registerFunction(mod, name, typeIdx);
	}

	makeType(input: Intrinsic[], output: Intrinsic[]): number {
		return this.typeSect.makeType(input, output);
	}

	toBinary() {
		const buffer = [];

		buffer.push(...[0x00, 0x61, 0x73, 0x6d]);    // PREAMBLE
		buffer.push(...[0x01, 0x00, 0x00, 0x00]);    // WASM_BINARY_VERSION
		buffer.push(...this.typeSect.toBinary());    // functype* : typesec
		buffer.push(...this.importSect.toBinary());  // imports*  : importsec
		buffer.push(...this.funcSect.toBinary());    // typeidx^n : funcsec
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