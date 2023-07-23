import { FuncRef } from "../funcRef";
import { EncodeU32 } from "../type";
import { Byte } from "../helper";

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