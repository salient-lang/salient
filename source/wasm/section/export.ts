import { EncodeU32 } from "../type";


export default class ExportSection {

	constructor() {}

	toBinary () {
		const size = 0;
		return [ExportSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 7;
}