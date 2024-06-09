import type { Byte } from "~/helper.ts";

// https://webassembly.github.io/spec/core/binary/types.html

export enum Intrinsic {
	i32 = 0x7f,
	i64 = 0x7e,
	f32 = 0x7d,
	f64 = 0x7c,

	vectype = 0x7b, // v128

	// ref type
	funcref = 0x70,
	externref = 0x6f,
}


const textEncoder = new TextEncoder();
export function EncodeName(str: string) {
	const buff = new Uint8Array(textEncoder.encode(str).buffer);

	return [
		...EncodeU32(buff.length),
		...buff
	];
}


export function EncodeLimitType(min: number, max?: number): Byte[] {
	if (!isFinite(min) || min < 0 || min % 1 !== 0)
		throw new Error(`Limit minimum must be a real unsigned integer not ${min}`);

	if (max) {
		if (!isFinite(max) || max < 0 || max % 1 !== 0)
			throw new Error(`Limit maximum must be a real unsigned integer not ${min}`);
		if (max < min)
			throw new Error(`Limit maximum must be greater than or equal to min (${min}<${max})`);

		return [0x01, ...EncodeU32(min), ...EncodeU32(max)];
	}

	return [0x00, ...EncodeU32(min)];
}



export function EncodeF32(val: number): Byte[] {
	const buffer = new ArrayBuffer(4);
	const view = new DataView(buffer);
	view.setFloat32(0, val, true);

	return [...(new Uint8Array(buffer))];
}

export function EncodeF64(val: number): Byte[] {
	const buffer = new ArrayBuffer(8);
	const view = new DataView(buffer);
	view.setFloat64(0, val, true);

	return [...(new Uint8Array(buffer))];
}



export function EncodeSignedLEB(val: number): Byte[] {
	if (val % 1 !== 0)
		throw new Error(`Requested u32 encode for non integer value ${val}`);

	const result: Byte[] = [];

	// LEB128 encoding: https://en.wikipedia.org/wiki/LEB128#Encode_signed_32-bit_integer
	while (true) {
		const byte = val & 0x7f;
		val >>= 7;
		if (
			(val === 0 && (byte & 0x40) === 0) ||
			(val === -1 && (byte & 0x40) !== 0)
		) {
			result.push(byte);
			break;
		}
		result.push(byte | 0x80);
	}

	return result;
}
export function EncodeUnsignedLEB(val: number): Byte[] {
	if (val % 1 !== 0) throw new Error(`Requested u32 encode for non integer value ${val}`);
	if (val < 0) throw new Error(`Requested u32 encode for signed integer value ${val}`);

	// LEB128 encoding: https://en.wikipedia.org/wiki/LEB128#Encode_unsigned_32-bit_integer
	const result: Byte[] = [];
	do {
		let byte = val & 0b01111111;
		val >>= 7;

		// Mark leading continuation bit
		if (val != 0) {
			byte |= 0b10000000;
		}
		result.push(byte);
	} while(val > 0);
	return result;
}

export function EncodeU32(val: number) {
	// if (val > 2**32) throw new Error(`Requested to encode an u32 with too large a number ${val}`);
	return EncodeUnsignedLEB(val);
}
export function EncodeI32(val: number) {
	// if (Math.abs(val) > 2**31) throw new Error(`Requested to encode an i32 with too large a number ${val}`);
	return EncodeSignedLEB(val);
}

export function EncodeU64(val: number) {
	// if (val > 2**64) throw new Error(`Requested to encode an u64 with too large a number ${val}`);
	return EncodeUnsignedLEB(val);
}
export function EncodeI64(val: number) {
	// if (Math.abs(val) > 2**63) throw new Error(`Requested to encode an i64 with too large a number ${val}`);
	return EncodeSignedLEB(val);
}