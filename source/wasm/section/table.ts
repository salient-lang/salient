import { EncodeU32 } from "../type";


export default class TableSection {

	constructor() {
	}

	toBinary () {
		const size = 0;
		return [TableSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 4;
}