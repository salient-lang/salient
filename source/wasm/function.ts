import * as Instruction from "~/wasm/instruction/index.ts";
import { EncodeU32, Intrinsic } from "~/wasm/type.ts";
import { FuncRef, LocalRef } from "~/wasm/funcRef.ts";
import { Byte } from "~/helper.ts";


export class Function {
	inputs  : number;
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

	resolve(idx: number, override = false) {
		this.ref.resolve(idx, override);
	}
	clear() {
		this.ref.clear();
	}

	getID() {
		return this.ref.get();
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
		const offsets = new Map<Intrinsic, number>();
		for (const ref of this.locals) {
			const key = ref.type;
			const offset = offsets.get(key) || types.get(key) || 0;
			ref.resolve(offset+this.inputs);
			offsets.set(key, offset+1);
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