import { EncodeU32 } from "../type";


export default class CodeSection {

	constructor() {}

	toBinary () {
		const size = 0;
		return [CodeSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 10;
}