import type { Byte } from "~/helper.ts";
import { EncodeName, EncodeU32 } from "~/wasm/type.ts";
import { FuncRef } from "~/wasm/funcRef.ts";
import { Box } from "~/helper.ts";

class Register {
	mod:  string;
	name: string;
	type: number;
	ref:  FuncRef;

	constructor (mod: string, name: string, typeIdx: number) {
		this.mod  = mod;
		this.name = name;
		this.type = typeIdx;
		this.ref  = new FuncRef(false);
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

interface ModuleMap {
	[key: string]: Register;
}

interface NamespaceMap {
	[key: string]: ModuleMap;
}


export default class ImportSection {
	_entries: NamespaceMap;
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
			mod[name] = new Register(module, name, typeIdx);
		} else if (mod[name].type !== typeIdx) return null;

		return mod[name].ref;
	}

	getFuncs(): number {
		return this._funcs;
	}

	toBinary (funcID: Box<number>): Byte[] {
		let length = 0;
		const buffer = [];

		for (const module in this._entries) {
			const mod = this._entries[module];

			for (const name in mod) {
				mod[name].ref.resolve(funcID.value++, true);
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