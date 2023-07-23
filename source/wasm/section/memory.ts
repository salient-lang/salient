import { Byte } from "../helper";
import { EncodeLimitType, EncodeU32 } from "../type";


type Range = {
	min: number,
	max: undefined | number
}

export default class MemorySection {
	memories: Range[];

	constructor() {
		this.memories = [];
	}

	addMemory(minPages: number, maxPages?: number): number {
		const idx = this.memories.length;
		this.memories.push({
			min: minPages,
			max: maxPages
		})

		return idx;
	}

	toBinary (): Byte[] {
		let buff: Byte[] = EncodeU32(this.memories.length);

		for (const mem of this.memories) {
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