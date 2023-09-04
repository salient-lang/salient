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

		// Encode local types and accumulate total offsets by type
		const buf = EncodeU32(types.size);
		let tally = 0;
		for (const [type, count] of types) { // locals ::=
			buf.push(...EncodeU32(count));     // n:u32
			buf.push(type);                    // t:valtype

			// accumulate
			types.set(type, tally);
			tally += count;
		}

		// Resolve local variable refs
		let offsets = new Map<Intrinsic, number>();;
		for (const ref of this.locals) {
			const key = ref.type;
			const offset = offsets.get(key) || types.get(key) || 0;
			ref.resolve(offset);
			offsets.set(key, offset+1);
		}

		console.log(76, buf);

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