import { EncodeU32 } from "../type";


export default class TypeSection {
	constructor() {
	}

	toBinary () {
		const size = 0;
		return [TypeSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 1;
}