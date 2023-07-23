import { EncodeU32 } from "../type";
import { Byte } from "../helper";
import { Data } from ".";


export default class DataCountSection {

	static toBinary (data: Data): Byte[] {
		const buf = [
			...EncodeU32(data.entries.length)
		];
		return [DataCountSection.typeID, ...EncodeU32(buf.length), ...buf];
	}

	static typeID = 12;
}