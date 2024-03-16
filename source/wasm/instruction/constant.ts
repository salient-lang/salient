// https://webassembly.github.io/spec/core/binary/instructions.html#numeric-instructions
import { EncodeF32, EncodeF64, EncodeI32, EncodeI64 } from "~/wasm/type.ts";
import { Byte } from "~/helper.ts";
import { LatentValue } from "~/helper.ts";


export enum Type {
	i32 = 0x41,
	i64 = 0x42,
	f32 = 0x43,
	f64 = 0x44,
}

export class Constant {
	type: Type;
	x   : number | LatentValue<number>;

	constructor(type: number, idx: number | LatentValue<number>) {
		this.type = type;
		this.x    = idx;
	}

	private read() {
		return this.x instanceof LatentValue
			? this.x.get()
			: this.x;
	}

	toBinary(): Byte[] {
		switch (this.type) {
			case Type.i32: return [
				this.type,
				...EncodeI32(this.read())
			];
			case Type.i64: return [
				this.type,
				...EncodeI64(this.read())
			];
			case Type.f32: return [
				this.type,
				...EncodeF32(this.read())
			];
			case Type.f64: return [
				this.type,
				...EncodeF64(this.read())
			];
		}

		throw new Error(`Unreachable code path reachable, type_idx: ${this.type}`);
	}
}

const wrapper = {
	i32: (x: number | LatentValue<number>) => new Constant(Type.i32, x),
	i64: (x: number | LatentValue<number>) => new Constant(Type.i64, x),
	f32: (x: number | LatentValue<number>) => new Constant(Type.f32, x),
	f64: (x: number | LatentValue<number>) => new Constant(Type.f64, x),
}
export default wrapper;