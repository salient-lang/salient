import { EncodeU32 } from "~/wasm/type.ts";
import { Box, Byte } from "~/helper.ts";
import { Function } from "~/wasm/function.ts";


export default class FunctionSection {
	static headerTypeID = 3;  // typeidx^n : funcsec
	static bodyTypeID   = 10; // code^n    : codesec

	private funcs: Function[];

	constructor() {
		this.funcs = [];
	}

	push(func: Function) {
		if (this.funcs.includes(func)) return;

		this.funcs.push(func);
	}

	remove(ref: Function['ref']) {
		for (let i=0; i<this.funcs.length; i++) {
			if (this.funcs[i].ref === ref) {
				this.funcs.splice(i, 1);

				return;
			}
		}
	}

	headerToBinary(funcID: Box<number>) {
		const buf: Byte[] = EncodeU32(this.funcs.length);

		for (const func of this.funcs) {
			func.resolve(funcID.value++, true);
			buf.push(...EncodeU32(func.type));
		}

		return [
			FunctionSection.headerTypeID,
			...EncodeU32(buf.length),
			...buf
		];
	}

	bodyToBinary (): Byte[] {
		const buf = EncodeU32(this.funcs.length);
		for (const func of this.funcs) {
			buf.push(...func.toBinary())
		}

		return [
			FunctionSection.bodyTypeID,
				...EncodeU32(buf.length),
				...buf
		];
	}
}