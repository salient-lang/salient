// https://webassembly.github.io/spec/core/binary/modules.html

import * as Type from "./type";

enum Section {
	Custom    = 0,
	Type      = 1,
	Import    = 2,
	Function  = 3,
	Table     = 4,
	Memory    = 5,
	Global    = 6,
	Export    = 7,
	Start     = 8,
	Element   = 9,
	Code      = 10,
	Data      = 11,
	DataCount = 12
}


export default class Module {


	constructor() {}

	makeType(types: Type.Intrinsic[]) {

	}

	toBinary() {
		const buffer = [];

		buffer.push(...[0x00, 0x61, 0x73, 0x6d]); // PREAMBLE
		buffer.push(...[0x01, 0x00, 0x00, 0x00]); // WASM_BINARY_VERSION

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