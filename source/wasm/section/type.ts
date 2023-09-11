import type { Byte } from "../../helper.ts";
import { EncodeU32, Intrinsic } from "../type.ts";



function DeepEqual(a: Byte[], b: Byte[]) {
	if (a.length !== b.length)
		return false;

	for (let i=0; i<a.length; i++) {
		if (a[i] !== b[i]) return false;
	}

	return true;
}



export default class TypeSection {
	_entries: Byte[][];

	constructor() {
		this._entries = [];
	}

	makeType(input: Intrinsic[], output: Intrinsic[]): number {
		const buffer = EncodeFuncType(input, output);

		let index = this.hasTypeBuffer(buffer);
		if (index === -1) {
			index = this._entries.length;
			this._entries.push(buffer);
		}

		return index;
	}

	hasTypeBuffer(buff: Byte[]) {
		for (let i=0; i<this._entries.length; i++) {
			if (DeepEqual(buff, this._entries[i])) return i;
		}

		return -1;
	}

	toBinary () {
		const buffer = this._entries.flatMap(x => x);
		const length = EncodeU32(this._entries.length);
		const size = length.length + buffer.length;
		return [
			TypeSection.typeID,
			...EncodeU32(size),
			...length,
			...buffer
		];
	}

	static typeID = 1;
}



function EncodeFuncType(input: Intrinsic[], output: Intrinsic[]): Byte[] {
	return [ 0x60, ...EncodeResultType(input), ...EncodeResultType(output) ];
}

function EncodeResultType(types: Intrinsic[]): Byte[] {
	return [ ...EncodeU32(types.length), ...types ];
}