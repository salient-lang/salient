import { LatentValue, type Byte } from "../helper.ts";
import { EncodeU32 } from "./type.ts";

export class MemoryRef extends LatentValue<number> {
	external: boolean;

	constructor(extern: boolean) {
		super();
		this.external = extern;
	}

	toBinary(): Byte[] {
		return [
			...EncodeU32(this.get())
		];
	}
}