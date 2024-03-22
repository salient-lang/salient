import { Intrinsic } from "~/wasm/type.ts";
import { EncodeU32 } from "~/wasm/type.ts";
import { Constant } from "~/wasm/instruction/constant.ts";
import { LocalRef } from "~/wasm/funcRef.ts";
import { Byte } from "~/helper.ts";

export class GlobalRegister {
	mutable: boolean;
	expr: Constant;
	ref: LocalRef;

	constructor(type: Intrinsic, mutable: boolean, expr: Constant, index: number) {
		this.ref = new LocalRef(type);
		this.mutable = mutable;
		this.expr = expr;
	}

	toBinary(): Byte[] {
		return [
			this.ref.type,
			this.mutable ? 0x01 : 0x00,

			...this.expr.toBinary(),
			0x0B // expr end
		];
	}
}

export default class GlobalSection {
	static typeID = 6;

	private bindings: GlobalRegister[];

	constructor() {
		this.bindings = [];
	}

	bind(type: Intrinsic, mut: boolean, expr: Constant) {
		const idx = this.bindings.length;

		const n = new GlobalRegister(type, mut, expr, idx);
		n.ref.resolve(idx);

		this.bindings.push(n);
		return n;
	}

	toBinary () {
		const buf = EncodeU32(this.bindings.length);
		for (const bind of this.bindings) {
			buf.push(...bind.toBinary());
		}

		return [
			GlobalSection.typeID,
			...EncodeU32(buf.length),
			...buf
		];
	}
}