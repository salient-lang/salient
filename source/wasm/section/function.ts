import { EncodeU32 } from "../type.ts";
import { Function } from "../function.ts";
import { Byte } from "../../helper.ts";


export default class FunctionSection {
	static typeID = 3;

	static toBinary(idxOffset: number, funcs: Function[]) {
		let buf: Byte[] = EncodeU32(funcs.length);

		for (const func of funcs) {
			func.resolve(idxOffset++, true);
			buf.push(...EncodeU32(func.type));
		}

		return [
			FunctionSection.typeID,
			...EncodeU32(buf.length),
			...buf
		];
	}
}