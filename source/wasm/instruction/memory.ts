// https://webassembly.github.io/spec/core/binary/instructions.html#numeric-instructions
import { EncodeF32, EncodeF64, EncodeI32, EncodeI64, EncodeU32 } from "../type";
import { Byte } from "../helper";


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
	offset : number;
	align  : number;

	constructor(type: Type, offset: number, align: number) {
		this.type   = type;
		this.offset = offset;
		this.align  = align;
	}

	toBinary(): Byte[] {
		return [
			this.type,
			...EncodeU32(this.align),
			...EncodeU32(this.offset),
		];
	}
}

const wrapper = {
	i32: {
		load  : (offset: number, align: number) => new MemoryRegister(Type.i32Load, offset, align),
		store : (offset: number, align: number) => new MemoryRegister(Type.i32Store, offset, align),

		load8_u  : (offset: number, align: number) => new MemoryRegister(Type.i32Load8u, offset, align),
		load8_s  : (offset: number, align: number) => new MemoryRegister(Type.i32Load8s, offset, align),
		load16_u : (offset: number, align: number) => new MemoryRegister(Type.i32Load16u, offset, align),
		load16_s : (offset: number, align: number) => new MemoryRegister(Type.i32Load16s, offset, align),

		store8  : (offset: number, align: number) => new MemoryRegister(Type.i32Store8, offset, align),
		store16 : (offset: number, align: number) => new MemoryRegister(Type.i32Store16, offset, align),
	},
	i64: {
		load  : (offset: number, align: number) => new MemoryRegister(Type.i64Load, offset, align),
		store : (offset: number, align: number) => new MemoryRegister(Type.i64Store, offset, align),

		load8_u  : (offset: number, align: number) => new MemoryRegister(Type.i64Load8u, offset, align),
		load8_s  : (offset: number, align: number) => new MemoryRegister(Type.i64Load8s, offset, align),
		load16_u : (offset: number, align: number) => new MemoryRegister(Type.i64Load16u, offset, align),
		load16_s : (offset: number, align: number) => new MemoryRegister(Type.i64Load16s, offset, align),
		load32_u : (offset: number, align: number) => new MemoryRegister(Type.i64Load32u, offset, align),
		load32_s : (offset: number, align: number) => new MemoryRegister(Type.i64Load32s, offset, align),

		store8  : (offset: number, align: number) => new MemoryRegister(Type.i64Store8, offset, align),
		store16 : (offset: number, align: number) => new MemoryRegister(Type.i64Store16, offset, align),
		store32 : (offset: number, align: number) => new MemoryRegister(Type.i64Store32, offset, align),
	},
}
export default wrapper;