import { EncodeU32 } from "~/wasm/type.ts";


export default class GlobalSection {

	constructor() {}

	toBinary () {
		const size = 0;
		return [GlobalSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 6;
}