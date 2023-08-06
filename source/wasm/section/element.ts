import { EncodeU32 } from "../type.js";


export default class ElementSection {

	constructor() {}

	toBinary () {
		const size = 0;
		return [ElementSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 9;
}