import { Byte } from "../helper";
import { EncodeU32 } from "../type";

export class GetLocal {
	x: number;

	constructor(idx: number) {
		this.x = idx;
	}

	toBinary(): Byte[] {
		return [
			0x20,
			...EncodeU32(this.x)
		];
	}
}

export class SetLocal {
	x: number;

	constructor(idx: number) {
		this.x = idx;
	}

	toBinary(): Byte[] {
		return [
			0x21,
			...EncodeU32(this.x)
		];
	}
}

export class TeeLocal {
	x: number;

	constructor(idx: number) {
		this.x = idx;
	}

	toBinary(): Byte[] {
		return [
			0x22,
			...EncodeU32(this.x)
		];
	}
}

export class GetGlobal {
	x: number;

	constructor(idx: number) {
		this.x = idx;
	}

	toBinary(): Byte[] {
		return [
			0x23,
			...EncodeU32(this.x)
		];
	}
}

export class SetGlobal {
	x: number;

	constructor(idx: number) {
		this.x = idx;
	}

	toBinary(): Byte[] {
		return [
			0x24,
			...EncodeU32(this.x)
		];
	}
}

const wrapper = {
	global: {
		get: GetGlobal,
		set: SetGlobal
	},
	local: {
		get: GetLocal,
		set: SetLocal,
		tee: TeeLocal
	}
}
export default wrapper;