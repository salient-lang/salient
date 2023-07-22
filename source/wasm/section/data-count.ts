import { EncodeU32 } from "../type";


export default class DataCountSection {

	constructor() {}

	toBinary () {
		const size = 0;
		return [DataCountSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 12;
}