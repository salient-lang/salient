import * as Types from "~/wasm/type.ts";
import { OperandType } from "~/compiler/codegen/expression/type.ts";
import { LinearType } from "~/compiler/codegen/expression/type.ts";

export class IntrinsicType {
	readonly bitcode: number;
	readonly name: string;
	readonly signed: boolean;
	readonly align: number;
	readonly size: number;

	// Used to differentiate i8 the type, and i8 the value
	readonly value: IntrinsicValue;

	constructor(name: string, signed: boolean, bitcode: number, size: number) {
		this.name = name;
		this.signed = signed;
		this.bitcode = bitcode;
		this.align = size;
		this.size = size;

		this.value = new IntrinsicValue(this);
	}

	declarationView() {
		return "0 | Native Intrinsic";
	}

	getTypeName() {
		return "type " + this.name;
	}

	like (other: OperandType) {
		if (other instanceof LinearType) return other.like(this);
		if (other instanceof IntrinsicType) return this === other;
		if (other instanceof IntrinsicValue) return this.value === other;
		if (other instanceof VirtualType) return false;

		return false;
	}

	getBitcode() {
		return this.bitcode;
	}

	tciBitDepth() {
		if (this.signed) return this.size*8 - 1;
		else return this.size*8;
	}
}

export class IntrinsicValue {
	type: IntrinsicType;

	constructor(type: IntrinsicType) {
		this.type = type;
	}

	getTypeName() {
		return this.type.name;
	}

	like (other: OperandType) {
		if (other instanceof LinearType) return other.like(this);
		if (other instanceof IntrinsicType) return this.type === other;
		if (other instanceof IntrinsicValue) return this === other;
		if (other instanceof VirtualType) return false;

		return false;
	}
}

export class VirtualType {
	name: string;

	constructor(name: string) {
		this.name = name;
	}

	getTypeName() {
		return this.name;
	}

	declarationView() {
		return "0 | Virtual Type";
	}

	like (other: OperandType) {
		if (other instanceof LinearType) return other.like(this);
		if (other instanceof VirtualType) return false;

		return false;
	}
}


export const bool = new IntrinsicType("bool", false, Types.Intrinsic.i32, 1);

export const  u8 = new IntrinsicType( "u8", false, Types.Intrinsic.i32, 1);
export const  i8 = new IntrinsicType( "i8", true,  Types.Intrinsic.i32, 1);
export const u16 = new IntrinsicType("u16", false, Types.Intrinsic.i32, 2);
export const i16 = new IntrinsicType("i16", true,  Types.Intrinsic.i32, 2);
export const u32 = new IntrinsicType("u32", false, Types.Intrinsic.i32, 4);
export const i32 = new IntrinsicType("i32", true,  Types.Intrinsic.i32, 4);
export const u64 = new IntrinsicType("u64", false, Types.Intrinsic.i64, 8);
export const i64 = new IntrinsicType("i64", true,  Types.Intrinsic.i64, 8);
export const f32 = new IntrinsicType("f32", false,  Types.Intrinsic.f32, 4);
export const f64 = new IntrinsicType("f64", false,  Types.Intrinsic.f64, 8);

export const never = new VirtualType("never");
export const none  = new VirtualType("none");