import * as Wasm from "../../wasm/index.js";

export class Register {
	type: Wasm.Type.Intrinsic;
	isFree: boolean;

	constructor(type: number, isFree: boolean) {
		this.isFree = isFree;
		this.type   = type;
	}
}

export class RegisterAllocator {
	_regs: Register[];

	constructor() {
		this._regs = [];
	}


	allocate(type: Wasm.Type.Intrinsic) {
		for (let i=0; i<this._regs.length; i++) {
			const reg = this._regs[i];
			if (reg.isFree && reg.type === type) {
				reg.isFree = false;
				return i;
			}
		}

		const index = this._regs.length;
		this._regs.push(new Register(type, false));
		return index;
	}

	bulkFree(regs: number[]) {
		for (let i=0; i<this._regs.length; i++) {
			if (regs.includes(i)) {
				this._regs[i].isFree = true;
			}
		}
	}
}