import { FuncRef } from "../funcRef.ts";
import { EncodeU32 } from "../type.ts";


export default class StartSection {

	static toBinary (ref: null | FuncRef) {
		const buf = [];

		if (ref === null) {
			buf.push(0);
		} else {
			buf.push(1);
			buf.push(...EncodeU32(ref.get()))
		}

		return [
			StartSection.typeID,
			...EncodeU32(buf.length),
			...buf
		];
	}

	static typeID = 8;
}