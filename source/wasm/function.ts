import { FuncRef } from "./funcRef";
import { Byte } from "./helper";
import { EncodeU32, Intrinsic } from "./type";


export class Function {
	inputs : number;
	outputs : number;
	type  : number;
	ref   : FuncRef;
	block : null;

	locals: Intrinsic[];

	constructor(typeIdx: number, inputs: number, outputs: number) {
		this.inputs  = inputs;
		this.outputs = outputs;

		this.type   = typeIdx;
		this.ref    = new FuncRef(false);
		this.locals = [];
		this.block  = null;
	}

	addLocal(type: Intrinsic): number {
		const idx = this.locals.length;
		this.locals.push(type);

		return this.inputs + idx;
	}

	resolve(idx: number, override: boolean = false) {
		this.ref.resolve(idx, override);
	}
	unresolve() {
		this.ref.unresolve();
	}

	getID() {
		return this.ref.getIdentifier();
	}


	toBinary (): Byte[] {
		const buf = EncodeU32(this.locals.length);
		for (const local of this.locals) {
			buf.push(local);
		}

		buf.push(0);

		return [
			...EncodeU32(buf.length),
			...buf
		];
	}
}