import * as Types from "~/wasm/type.ts";

export class Intrinsic {
	bitcode: number;
	name: string;
	align: number;
	size: number;

	constructor(name: string, bitcode: number, size: number) {
		this.name = name;
		this.bitcode = bitcode;
		this.align = size;
		this.size = size;
	}

	declarationView() {
		return "0 | Native Intrinsic";
	}
}

export class VirtualType {
	name: string;

	constructor(name: string) {
		this.name = name;
	}

	declarationView() {
		return "0 | Virtual Type";
	}
}


export const bool = new Intrinsic("bool", Types.Intrinsic.i32, 1);

export const  u8 = new Intrinsic( "u8", Types.Intrinsic.i32, 1);
export const  i8 = new Intrinsic( "i8", Types.Intrinsic.i32, 1);
export const i16 = new Intrinsic("i16", Types.Intrinsic.i32, 2);
export const u16 = new Intrinsic("u16", Types.Intrinsic.i32, 2);
export const i32 = new Intrinsic("i32", Types.Intrinsic.i32, 4);
export const u32 = new Intrinsic("u32", Types.Intrinsic.i32, 4);
export const i64 = new Intrinsic("i64", Types.Intrinsic.i64, 8);
export const u64 = new Intrinsic("u64", Types.Intrinsic.i64, 8);
export const f32 = new Intrinsic("f32", Types.Intrinsic.f32, 4);
export const f64 = new Intrinsic("f64", Types.Intrinsic.f64, 8);

export const never = new VirtualType("never");
export const none  = new VirtualType("none");