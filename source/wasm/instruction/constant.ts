// https://webassembly.github.io/spec/core/binary/instructions.html#numeric-instructions
import { EncodeF32, EncodeF64, EncodeI32, EncodeI64, EncodeU32, EncodeU64 } from "~/wasm/type.ts";
import { LatentOffset, LatentValue, Byte } from "~/helper.ts";


export enum Type {
	i32 = 0x41,
	i64 = 0x42,
	f32 = 0x43,
	f64 = 0x44,
}

export class Constant {
	type: Type;
	x   : number | LatentValue<number> | LatentOffset;

	constructor(type: number, idx: number | LatentValue<number> | LatentOffset) {
		this.type = type;
		this.x    = idx;
	}

	private read() {
		return typeof this.x === "number" ? this.x
			: this.x.get();
	}

	toBinary(): Byte[] {
		const val = this.read();

		switch (this.type) {
			case Type.i32: return [
				this.type,
				...(val < 0 ? EncodeI32(val) : EncodeU32(val))
			];
			case Type.i64: return [
				this.type,
				...(val < 0 ? EncodeI64(val) : EncodeU64(val))
			];
			case Type.f32: return [
				this.type,
				...EncodeF32(val)
			];
			case Type.f64: return [
				this.type,
				...EncodeF64(val)
			];
		}

		throw new Error(`Unreachable code path reachable, type_idx: ${this.type}`);
	}
}

const wrapper = {
	i32: (x: number | LatentValue<number> | LatentOffset) => new Constant(Type.i32, x),
	i64: (x: number | LatentValue<number>) => new Constant(Type.i64, x),
	f32: (x: number | LatentValue<number>) => new Constant(Type.f32, x),
	f64: (x: number | LatentValue<number>) => new Constant(Type.f64, x),
}
export default wrapper;