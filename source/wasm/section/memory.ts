import { EncodeU32 } from "../type";


export default class MemorySection {

	constructor() {}

	toBinary () {
		const size = 0;
		return [MemorySection.typeID, ...EncodeU32(size)];
	}

	static typeID = 5;
}