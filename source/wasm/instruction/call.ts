import { EncodeU32 } from "../type.ts";
import { FuncRef } from "../funcRef.ts";
import { Byte } from "../../helper.ts";

export default class Call {
	x: FuncRef | number;

	constructor(funcRef: FuncRef | number) {
		this.x = funcRef;
	}

	toBinary(): Byte[] {
		return [
			0x10,
			...EncodeU32(this.x instanceof FuncRef ? this.x.getIdentifier() : this.x)
		];
	}
}