import { EncodeU32 } from "../type";


export default class ImportSection {
	constructor() {
	}

	toBinary () {
		const size = 0;
		return [ImportSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 2;
}