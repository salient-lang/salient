import { EncodeU32 } from "../type";


export default class DataSection {

	constructor() {}

	toBinary () {
		const size = 0;
		return [DataSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 11;
}