import { EncodeU32 } from "../type";


export default class StartSection {

	constructor() {}

	toBinary () {
		const size = 0;
		return [StartSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 8;
}