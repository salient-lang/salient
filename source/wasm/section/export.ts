// https://webassembly.github.io/spec/core/binary/modules.html#export-section
import { EncodeName, EncodeU32 } from "~/wasm/type.ts";
import { AssertUnreachable } from "~/helper.ts";
import { GlobalRegister } from "~/wasm/section/global.ts";
import { MemoryRef } from "~/wasm/memoryRef.ts";
import { FuncRef } from "~/wasm/funcRef.ts";


interface Registry {
	[key: string]: FuncRef | MemoryRef | GlobalRegister;
}

export default class ExportSection {
	reg: Registry;

	constructor() {
		this.reg = {};
	}

	bind(name: string, ref: FuncRef | MemoryRef | GlobalRegister) {
		if (this.reg[name])
			throw new Error(`Attempting to export on already used name ${name}`);

		this.reg[name] = ref;
	}

	toBinary () {
		const buf = EncodeU32(Object.keys(this.reg).length);

		for (const name in this.reg) {
			const entity = this.reg[name];
			buf.push(...EncodeName(name));

			if (entity instanceof FuncRef) buf.push(0x00);
			else if (entity instanceof MemoryRef) buf.push(0x02);
			else if (entity instanceof GlobalRegister) buf.push(0x03);
			else AssertUnreachable(entity);

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