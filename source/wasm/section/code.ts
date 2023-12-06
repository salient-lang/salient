import { EncodeU32 } from "~/wasm/type.ts";
import { Function } from "~/wasm/function.ts";
import { Byte } from "~/helper.ts";


export default class CodeSection {

	constructor() {}

	static toBinary (funcs: Function[]): Byte[] {
		const buf = EncodeU32(funcs.length);
		for (const func of funcs) {
			buf.push(...func.toBinary())
		}

		return [CodeSection.typeID, ...EncodeU32(buf.length), ...buf];
	}

	static typeID = 10;
}