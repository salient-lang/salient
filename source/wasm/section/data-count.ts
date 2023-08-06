import { EncodeU32 } from "../type.js";
import { Byte } from "../helper.js";
import { Data } from "./index.js";


export default class DataCountSection {

	static toBinary (data: Data): Byte[] {
		const buf = [
			...EncodeU32(data.entries.length)
		];
		return [DataCountSection.typeID, ...EncodeU32(buf.length), ...buf];
	}

	static typeID = 12;
}