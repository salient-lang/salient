import type { Byte } from "../helper.ts";

import { EncodeU32, Intrinsic } from "./type.ts";

export class FuncRef {
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
			this.external ? 0x6f : 0x70,
			...EncodeU32(this.idx)
		];
	}
}

export class LocalRef {
	resolved: boolean;
	type: Intrinsic;
	idx: number;

	constructor(type: Intrinsic) {
		this.resolved = false;
		this.type = type;
		this.idx = 0;
	}

	resolve(idx: number, override: boolean = false) {
		if (!override && this.resolved) throw new Error("This local variable reference has already been resolved");

		this.resolved = true;
		this.idx = idx;
	}

	unresolve() {
		this.resolved = false;
	}

	getIdentifier(): number {
		if (!this.resolved) throw new Error("Cannot get the identifier of an unresolved variable ref");
		return this.idx;
	}
}