import { Byte } from "../helper.ts";
import { MemoryRef } from "../memoryRef.ts";
import { EncodeLimitType, EncodeU32 } from "../type.ts";


type Range = {
	min: number,
	max: undefined | number,
	ref: MemoryRef
}

export default class MemorySection {
	memories: Range[];

	constructor() {
		this.memories = [];
	}

	addMemory(ref: MemoryRef, minPages: number, maxPages?: number) {
		this.memories.push({
			min: minPages,
			max: maxPages,
			ref: ref
		})
	}

	toBinary (idxOffset: number): Byte[] {
		let buff: Byte[] = EncodeU32(this.memories.length);

		for (const mem of this.memories) {
			mem.ref.resolve(idxOffset++, true);
			buff.push(...EncodeLimitType(mem.min, mem.max));
		}

		return [
			MemorySection.typeID,
			...EncodeU32(buff.length),
			...buff
		];
	}

	static typeID = 5;
}