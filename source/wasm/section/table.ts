import { EncodeU32 } from "~/wasm/type.ts";


export default class TableSection {

	constructor() {
	}

	toBinary () {
		const size = 0;
		return [TableSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 4;
}