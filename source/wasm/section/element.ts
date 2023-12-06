import { EncodeU32 } from "~/wasm/type.ts";


export default class ElementSection {

	constructor() {}

	toBinary () {
		const size = 0;
		return [ElementSection.typeID, ...EncodeU32(size)];
	}

	static typeID = 9;
}