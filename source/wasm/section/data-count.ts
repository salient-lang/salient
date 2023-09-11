import { EncodeU32 } from "../type.ts";
import { Byte } from "../helper.ts";
import { Data } from "./index.ts";


export default class DataCountSection {

	static toBinary (data: Data): Byte[] {
		const buf = [
			...EncodeU32(data.entries.length)
		];
		return [DataCountSection.typeID, ...EncodeU32(buf.length), ...buf];
	}

	static typeID = 12;
}