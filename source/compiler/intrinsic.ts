import * as Types from "../wasm/type.ts";

export class Intrinsic {
	bitcode: number;
	name: string;
	size: number;

	constructor(name: string, bitcode: number, size: number) {
		this.name = name;
		this.bitcode = bitcode;
		this.size = size;
	}

	declarationView() {
		return "0 | Native Intrinsic";
	}
}


export const i32 = new Intrinsic("i32", Types.Intrinsic.i32, 4);
export const u32 = new Intrinsic("u32", Types.Intrinsic.i32, 4);
export const i64 = new Intrinsic("i64", Types.Intrinsic.i64, 8);
export const u64 = new Intrinsic("u64", Types.Intrinsic.i64, 8);
export const f32 = new Intrinsic("f32", Types.Intrinsic.f32, 4);
export const f64 = new Intrinsic("f64", Types.Intrinsic.f64, 8);