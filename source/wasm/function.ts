import { FuncRef } from "./funcRef";
import { Byte } from "./helper";


export class Function {
	type  : number;
	ref   : FuncRef;
	block : null;

	constructor(typeIdx: number) {
		this.type  = typeIdx;
		this.ref   = new FuncRef(false);
		this.block = null;
	}

	resolve(idx: number, override: boolean = false) {
		this.ref.resolve(idx, override);
	}
	unresolve() {
		this.ref.unresolve();
	}
}