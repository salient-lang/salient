// https://webassembly.github.io/spec/core/binary/modules.html

export default class Module {
	constructor() {}

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