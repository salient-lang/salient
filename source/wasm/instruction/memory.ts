// https://webassembly.github.io/spec/core/binary/instructions.html#numeric-instructions
import { LatentOffset } from "~/helper.ts";
import { EncodeU32 } from "~/wasm/type.ts";
import { Byte } from "~/helper.ts";


export enum Type {
	i32Load = 0x28,
	i64Load = 0x29,
	f32Load = 0x2A,
	f64Load = 0x2B,

	i32Load8s  = 0x2C,
	i32Load8u  = 0x2D,
	i32Load16s = 0x2E,
	i32Load16u = 0x2F,

	i64Load8s  = 0x30,
	i64Load8u  = 0x31,
	i64Load16s = 0x32,
	i64Load16u = 0x33,
	i64Load32s = 0x34,
	i64Load32u = 0x35,

	i32Store   = 0x36,
	i64Store   = 0x37,
	f32Store   = 0x38,
	f64Store   = 0x39,
	i32Store8  = 0x3A,
	i32Store16 = 0x3B,
	i64Store8  = 0x3C,
	i64Store16 = 0x3D,
	i64Store32 = 0x3E
}

export class MemoryRegister {
	type   : Type;
	offset : number | LatentOffset;
	align  : number;

	constructor(type: Type, offset: number | LatentOffset, align: number) {
		this.type   = type;
		this.offset = offset;
		this.align  = align;
	}

	toBinary(): Byte[] {
		return [
			this.type,
			...EncodeU32(this.align),
			...EncodeU32(
				this.offset instanceof LatentOffset
					? this.offset.get()
					: this.offset
			),
		];
	}
}

export class MemoryCopy {
	fromIdx: number;
	toIdx: number;

	constructor(fromIdx: Byte, toIdx: Byte) {
		this.fromIdx = fromIdx;
		this.toIdx = toIdx;
	}

	toBinary(): Byte[] {
		return [
			0xFC,
			...EncodeU32(10),
			this.fromIdx,
			this.toIdx
		]
	}
}

export class MemoryFill {
	memoryIdx: number;

	constructor(memoryIdx: Byte) {
		this.memoryIdx = memoryIdx;
	}

	toBinary(): Byte[] {
		return [
			0xFC,
			...EncodeU32(11),
			this.memoryIdx,
		]
	}
}

const wrapper = {
	i32: {
		load  : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i32Load, offset, align),
		store : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i32Store, offset, align),

		load8_u  : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i32Load8u, offset, align),
		load8_s  : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i32Load8s, offset, align),
		load16_u : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i32Load16u, offset, align),
		load16_s : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i32Load16s, offset, align),

		store8  : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i32Store8, offset, align),
		store16 : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i32Store16, offset, align),
	},
	i64: {
		load  : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i64Load, offset, align),
		store : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i64Store, offset, align),

		load8_u  : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i64Load8u, offset, align),
		load8_s  : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i64Load8s, offset, align),
		load16_u : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i64Load16u, offset, align),
		load16_s : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i64Load16s, offset, align),
		load32_u : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i64Load32u, offset, align),
		load32_s : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i64Load32s, offset, align),

		store8  : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i64Store8, offset, align),
		store16 : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i64Store16, offset, align),
		store32 : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.i64Store32, offset, align),
	},

	f32: {
		load  : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.f32Load, offset, align),
		store : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.f32Store, offset, align),
	},
	f64: {
		load  : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.f64Load, offset, align),
		store : (offset: number | LatentOffset, align: number) => new MemoryRegister(Type.f64Store, offset, align),
	},

	copy: (fromMemoryIdx = 0, toMemoryIdx = 0) => new MemoryCopy(fromMemoryIdx, toMemoryIdx),
	fill: (memoryIdx = 0) => new MemoryFill(memoryIdx),
}
export default wrapper;