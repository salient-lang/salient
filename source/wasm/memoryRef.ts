import type { Byte } from "./helper.ts";
import { EncodeU32 } from "./type.ts";

export class MemoryRef {
	external: boolean;
	resolved: boolean;
	idx: number;

	constructor(extern: boolean) {
		this.external = extern;
		this.resolved = false;
		this.idx = 0;
	}

	resolve(idx: number, override: boolean = false) {
		if (!override && this.resolved) throw new Error("This function reference has already been resolved");

		this.resolved = true;
		this.idx = idx;
	}

	unresolve() {
		this.resolved = false;
	}

	getIdentifier(): number {
		if (!this.resolved) throw new Error("Cannot get the identifier of an unresolved function ref");
		return this.idx;
	}

	toBinary(): Byte[] {
		if (!this.resolved) throw new Error("Cannot emit binary for unresolved function ref");

		return [
			...EncodeU32(this.idx)
		];
	}
}