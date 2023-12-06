import { EncodeName, EncodeU32 } from "~/wasm/type.ts";
import { MemoryRef } from "~/wasm/memoryRef.ts";
import { FuncRef } from "~/wasm/funcRef.ts";


interface Registry {
	[key: string]: FuncRef | MemoryRef;
}

export default class ExportSection {
	reg: Registry;

	constructor() {
		this.reg = {};
	}

	bind(name: string, ref: FuncRef | MemoryRef) {
		if (this.reg[name])
			throw new Error(`Attempting to export on already used name ${name}`);

		this.reg[name] = ref;
	}

	toBinary () {
		const buf = EncodeU32(Object.keys(this.reg).length);

		for (const name in this.reg) {
			const entity = this.reg[name];
			buf.push(...EncodeName(name));
			buf.push(entity instanceof FuncRef ? 0x00 : 0x02);
			buf.push(...EncodeU32(this.reg[name].get()));
		}

		return [
			ExportSection.typeID,
			...EncodeU32(buf.length),
			...buf
		];
	}

	static typeID = 7;
}