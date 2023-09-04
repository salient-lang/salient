import { LocalRef } from "../../wasm/funcRef.js";
import { Function } from "../../wasm/function.js";
import * as Wasm from "../../wasm/index.js";

export class Register {
	type: Wasm.Type.Intrinsic;
	isFree: boolean;
	ref: LocalRef;

	constructor(type: number, ref: LocalRef, isFree: boolean = false) {
		this.isFree = isFree;
		this.type   = type;
		this.ref    = ref;
	}
}

export class RegisterAllocator {
	_args: number;
	_regs: Register[];
	func: Function;

	constructor(func: Function) {
		this._args = 0;
		this._regs = [];
		this.func = func;
	}

	allocate(type: Wasm.Type.Intrinsic, isArg: boolean = false) {
		if (isArg) {
			let ref = new LocalRef(type);
			ref.resolve(this._args++);

			return new Register(type, ref);
		}

		for (let i=0; i<this._regs.length; i++) {
			const reg = this._regs[i];
			if (reg.isFree && reg.type === type) {
				reg.isFree = false;
				return reg;
			}
		}

		const reg = new Register(type, this.func.addLocal(type));
		this._regs.push(reg);

		return reg;
	}
}