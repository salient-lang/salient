import type { Byte } from "../helper";
import { EncodeU32 } from "../type";

class Register {
	mod:  string;
	name: string;
	type: number;

	constructor (mod: string, name: string, typeIdx: number) {
		this.mod = mod;
		this.name = name;
		this.type = typeIdx;
	}

	toBinary(): Byte[] {
		const encoder = new TextEncoder();
		const buffMod = new Uint8Array(encoder.encode(this.mod).buffer);
		const buffName = new Uint8Array(encoder.encode(this.name).buffer);
		return [
			...EncodeU32(buffMod.length),
			...buffMod,
			...EncodeU32(buffName.length),
			...buffName,
			...EncodeU32(0x00),      // Import type
			...EncodeU32(this.type)
		];
	}
}

interface InnerObject {
	[key: string]: Register;
}

interface OuterObject {
	[key: string]: InnerObject;
}


export default class ImportSection {
	_entries: OuterObject;

	constructor() {
		this._entries = {};
	}

	registerFunction(module: string, name: string, typeIdx: number) {
		if (!this._entries[module]) {
			this._entries[module] = {};
		}
		const mod = this._entries[module];

		if (!mod[name]) {
			mod[name] = new Register(module, name, typeIdx);
			return;
		}

		if (mod[name].type !== typeIdx) {
			throw new Error(`Attempting to register import "${module}" "${name}" with new type`);
		}

		return true;
	}

	toBinary (): Byte[] {
		let length = 0;
		const buffer = [];

		for (const module in this._entries) {
			const mod = this._entries[module];

			for (const name in mod) {
				buffer.push(...mod[name].toBinary());
				length++;
			}
		}

		const encodedLength = EncodeU32(length);
		const size = encodedLength.length + buffer.length;
		return [
			ImportSection.typeID,
			...EncodeU32(size),
			...encodedLength,
			...buffer
		];
	}

	static typeID = 2;
}