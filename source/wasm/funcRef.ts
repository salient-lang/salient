import { LatentValue, type Byte } from "../helper.ts";

import { EncodeU32, Intrinsic } from "./type.ts";

export class FuncRef extends LatentValue<number> {
	external: boolean;

	constructor(extern: boolean) {
		super();
		this.external = extern;
	}

	toBinary(): Byte[] {
		return [
			this.external ? 0x6f : 0x70,
			...EncodeU32(this.get())
		];
	}
}


export class LocalRef extends LatentValue<number> {
	type: Intrinsic;

	constructor(type: Intrinsic) {
		super();
		this.type = type;
	}
}