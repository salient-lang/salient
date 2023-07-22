// https://webassembly.github.io/spec/core/binary/modules.html

import * as Section from "./section/index";
import { Intrinsic } from "./type";




export default class Module {
	typeSec: Section.Type;

	constructor() {
		this.typeSec = new Section.Type();
	}

	makeType(input: Intrinsic[], output: Intrinsic[]) {
		return this.typeSec.makeType(input, output);
	}

	toBinary() {
		const buffer = [];

		buffer.push(...[0x00, 0x61, 0x73, 0x6d]); // PREAMBLE
		buffer.push(...[0x01, 0x00, 0x00, 0x00]); // WASM_BINARY_VERSION
		buffer.push(...this.typeSec.toBinary());

		// functype* : typesec
		// imports*  : importsec
		// typeidx^n : funcsec
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