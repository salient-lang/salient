import { EncodeU32 } from "../type";


export default class CustomSection {

	constructor() {
	}

	toBinary () {
		const size = 0;
		return [CustomSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 0;
}