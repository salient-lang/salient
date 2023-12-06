import type { Byte } from "~/helper.ts";
import { EncodeName, EncodeU32 } from "~/wasm/type.ts";

class Register {
	mod:  string;
	name: string;
	type: number;
	idx:  number;

	constructor (mod: string, name: string, typeIdx: number, idx: number) {
		this.mod  = mod;
		this.name = name;
		this.type = typeIdx;
		this.idx  = idx;
	}

	toBinary(): Byte[] {
		return [
			...EncodeName(this.mod),
			...EncodeName(this.name),
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
	_funcs: number;

	constructor() {
		this._entries = {};
		this._funcs = 0;
	}

	registerFunction(module: string, name: string, typeIdx: number) {
		if (!this._entries[module]) {
			this._entries[module] = {};
		}
		const mod = this._entries[module];

		if (!mod[name]) {
			mod[name] = new Register(module, name, typeIdx, this._funcs++);
		} else if (mod[name].type !== typeIdx) {
			throw new Error(`Attempting to register import "${module}" "${name}" with new type`);
		}

		return mod[name].idx;
	}

	getFuncs(): number {
		return this._funcs;
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