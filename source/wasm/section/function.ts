import { EncodeU32 } from "../type";


export default class FunctionSection {

	constructor() {
	}

	toBinary () {
		const size = 0;
		return [FunctionSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 3;
}