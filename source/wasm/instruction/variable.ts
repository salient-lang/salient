// https://webassembly.github.io/spec/core/binary/instructions.html#variable-instructions
import { EncodeU32 } from "../type.ts";
import { LocalRef } from "../funcRef.ts";
import { Byte } from "../../helper.ts";


export enum Type {
	localGet  = 0x20,
	localSet  = 0x21,
	localTee  = 0x22,
	globalGet = 0x23,
	globalSet = 0x24,
}

export class Variable {
	type: Type;
	x   : LocalRef | number;

	constructor(type: Type, idx: LocalRef | number) {
		this.type = type;
		this.x    = idx;
	}

	toBinary(): Byte[] {
		return [
			this.type,
			...EncodeU32(this.x instanceof LocalRef
					? this.x.getIdentifier()
					: this.x
				)
		];
	}
}

const wrapper = {
	global: {
		get: (x: number) => new Variable(Type.globalGet, x),
		set: (x: number) => new Variable(Type.globalSet, x)
	},
	local: {
		get: (x: LocalRef | number) => new Variable(Type.localGet, x),
		set: (x: LocalRef | number) => new Variable(Type.localSet, x),
		tee: (x: LocalRef | number) => new Variable(Type.localTee, x),
	}
}
export default wrapper;