import { FuncRef, LocalRef } from "./funcRef.js";
import { Byte } from "./helper.js";
import { EncodeU32, Intrinsic } from "./type.js";
import * as Instruction from "./instruction/index.js";


export class Function {
	inputs : number;
	outputs : number;
	type  : number;
	ref   : FuncRef;
	code  : Instruction.Any[];

	locals: LocalRef[];

	constructor(typeIdx: number, inputs: number, outputs: number) {
		this.inputs  = inputs;
		this.outputs = outputs;

		this.type   = typeIdx;
		this.ref    = new FuncRef(false);
		this.locals = [];
		this.code   = [];
	}

	addLocal(type: Intrinsic): LocalRef {
		const ref = new LocalRef(type);
		this.locals.push(ref);

		return ref;
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
		// Count the number of instances of each type
		const types = new Map<Intrinsic, number>();
		for (const ref of this.locals) {
			types.set(
				ref.type,
				(types.get(ref.type) || 0) + 1
			);
		}

		const buf = EncodeU32(Object.keys(types).length);
		let offset = 0;
		for (const entry of types) {      // locals ::=
			const count = entry[1];
			const type  = entry[0];
			buf.push(...EncodeU32(count));  // n:u32
			buf.push(type);                 // t:valtype

			// Resolve local variable refs
			for (const ref of this.locals) {
				if (ref.type !== type) continue;
				ref.resolve(offset);
				offset++;
			}
		}

		for (const line of this.code) {
			buf.push(...line.toBinary());
		}
		buf.push(0x0b); // end marker

		return [
			...EncodeU32(buf.length),
			...buf
		];
	}
}