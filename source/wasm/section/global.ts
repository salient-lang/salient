import { EncodeU32 } from "../type.js";


export default class GlobalSection {

	constructor() {}

	toBinary () {
		const size = 0;
		return [GlobalSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 6;
}