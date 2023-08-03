// https://webassembly.github.io/spec/core/binary/instructions.html#numeric-instructions
import { EncodeF32, EncodeF64, EncodeI32, EncodeI64 } from "../type";
import { Byte } from "../helper";


export enum Type {
	i32 = 0x41,
	i64 = 0x42,
	f32 = 0x43,
	f64 = 0x44,
}

export class Constant {
	type: Type;
	x   : number;

	constructor(type: number, idx: number) {
		this.type = type;
		this.x    = idx;
	}

	toBinary(): Byte[] {
		switch (this.type) {
			case Type.i32: return [
				this.type,
				...EncodeI32(this.x)
			];
			case Type.i64: return [
				this.type,
				...EncodeI64(this.x)
			];
			case Type.f32: return [
				this.type,
				...EncodeF32(this.x)
			];
			case Type.i64: return [
				this.type,
				...EncodeF64(this.x)
			];
		}

		throw new Error("Unreachable code path reachable");
	}
}

const wrapper = {
	i32: (x: number) => new Constant(Type.i32, x),
	i64: (x: number) => new Constant(Type.i64, x),
	f32: (x: number) => new Constant(Type.f32, x),
	f64: (x: number) => new Constant(Type.f64, x),
}
export default wrapper;