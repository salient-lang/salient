import type { Byte } from "./helper";

// https://webassembly.github.io/spec/core/binary/types.html

export enum AtomType {
	i32 = 0x7f,
	i64 = 0x7e,
	f32 = 0x7d,
	f64 = 0x7c,

	vectype = 0x7b, // v128

	// ref type
	funcref = 0x70,
	externref = 0x6f,
}


export function EncodeFuncType(input: AtomType[], output: AtomType[]): Byte[] {
	return [ 0x60, ...EncodeResultType(input), ...EncodeResultType(output) ];
}

export function EncodeResultType(types: AtomType[]): Byte[] {
	return [ ...EncodeU32(types.length), ...types ];
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
	let buffer = new ArrayBuffer(4);
	let view = new DataView(buffer);
	view.setFloat32(0, val, true);

	return [...(new Uint8Array(buffer))];
}

export function EncodeF64(val: number): Byte[] {
	let buffer = new ArrayBuffer(8);
	let view = new DataView(buffer);
	view.setFloat64(0, val, true);

	return [...(new Uint8Array(buffer))];
}



export function EncodeI32(val: number): Byte[] {
	if (val % 1 !== 0)
		throw new Error(`Requested i32 encode for non integer value ${val}`);

	// LEB128 encoding from
	// https://gitlab.com/mjbecze/leb128/-/blob/master/signed.js
	const result = [];
	let more = true;
	while (more) {
		let byte_ = val & 0x7f;
		val >>= 7;

		// if val is negative then fill the rest with 1s, else with 0s
		if (val === 0 && (byte_ & 0x40) === 0 || val === -1 && (byte_ & 0x40) !== 0) {
			more = false;
		} else {
			byte_ |= 0x80;
		}
		result.push(byte_);
	}
	return result;
}

export function EncodeU32(val: number): Byte[] {
	if (val % 1 !== 0)
		throw new Error(`Requested u32 encode for non integer value ${val}`);
	if (val < 0)
		throw new Error(`Requested u32 encode for signed integer value ${val}`);

	// LEB128 encoding: https://en.wikipedia.org/wiki/LEB128#Encode_signed_32-bit_integer
	val |= 0;
	const result = [];
	while (true) {
		const byte_ = val & 0x7f;
		val >>= 7;
		if (
			(val === 0 && (byte_ & 0x40) === 0) ||
			(val === -1 && (byte_ & 0x40) !== 0)
		) {
			result.push(byte_);
			return result;
		}
		result.push(byte_ | 0x80);
	}
}