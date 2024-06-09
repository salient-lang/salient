// https://webassembly.github.io/spec/core/binary/instructions.html#numeric-instructions
import { Byte } from "~/helper.ts";

export class NumericInstruction {
	code: Byte;

	constructor(code: Byte) {
		this.code = code;
	}

	toBinary(): Byte[] {
		return [this.code];
	}
}

const i32eqz  = new NumericInstruction(0x45);
const i32eq   = new NumericInstruction(0x46);
const i32ne   = new NumericInstruction(0x47);
const i32lt_s = new NumericInstruction(0x48);
const i32lt_u = new NumericInstruction(0x49);
const i32gt_s = new NumericInstruction(0x4A);
const i32gt_u = new NumericInstruction(0x4B);
const i32le_s = new NumericInstruction(0x4C);
const i32le_u = new NumericInstruction(0x4D);
const i32ge_s = new NumericInstruction(0x4E);
const i32ge_u = new NumericInstruction(0x4F);

const i64eqz  = new NumericInstruction(0x50);
const i64eq   = new NumericInstruction(0x51);
const i64ne   = new NumericInstruction(0x52);
const i64lt_s = new NumericInstruction(0x53);
const i64lt_u = new NumericInstruction(0x54);
const i64gt_s = new NumericInstruction(0x55);
const i64gt_u = new NumericInstruction(0x56);
const i64le_s = new NumericInstruction(0x57);
const i64le_u = new NumericInstruction(0x58);
const i64ge_s = new NumericInstruction(0x59);
const i64ge_u = new NumericInstruction(0x5A);

const f32eq = new NumericInstruction(0x5B);
const f32ne = new NumericInstruction(0x5C);
const f32lt = new NumericInstruction(0x5D);
const f32gt = new NumericInstruction(0x5E);
const f32le = new NumericInstruction(0x5F);
const f32ge = new NumericInstruction(0x60);

const f64eq = new NumericInstruction(0x61);
const f64ne = new NumericInstruction(0x62);
const f64lt = new NumericInstruction(0x63);
const f64gt = new NumericInstruction(0x64);
const f64le = new NumericInstruction(0x65);
const f64ge = new NumericInstruction(0x66);

const i32clz    = new NumericInstruction(0x67);
const i32ctz    = new NumericInstruction(0x68);
const i32popcnt = new NumericInstruction(0x69);
const i32add    = new NumericInstruction(0x6A);
const i32sub    = new NumericInstruction(0x6B);
const i32mul    = new NumericInstruction(0x6C);
const i32div_s  = new NumericInstruction(0x6D);
const i32div_u  = new NumericInstruction(0x6E);
const i32rem_s  = new NumericInstruction(0x6F);
const i32rem_u  = new NumericInstruction(0x70);
const i32and    = new NumericInstruction(0x71);
const i32or     = new NumericInstruction(0x72);
const i32xor    = new NumericInstruction(0x73);
const i32shl    = new NumericInstruction(0x74);
const i32shr_s  = new NumericInstruction(0x75);
const i32shr_u  = new NumericInstruction(0x76);
const i32rotl   = new NumericInstruction(0x77);
const i32rotr   = new NumericInstruction(0x78);

const i64clz    = new NumericInstruction(0x79);
const i64ctz    = new NumericInstruction(0x7A);
const i64popcnt = new NumericInstruction(0x7B);
const i64add    = new NumericInstruction(0x7C);
const i64sub    = new NumericInstruction(0x7D);
const i64mul    = new NumericInstruction(0x7E);
const i64div_s  = new NumericInstruction(0x7F);
const i64div_u  = new NumericInstruction(0x80);
const i64rem_s  = new NumericInstruction(0x81);
const i64rem_u  = new NumericInstruction(0x82);
const i64and    = new NumericInstruction(0x83);
const i64or     = new NumericInstruction(0x84);
const i64xor    = new NumericInstruction(0x85);
const i64shl    = new NumericInstruction(0x86);
const i64shr_s  = new NumericInstruction(0x87);
const i64shr_u  = new NumericInstruction(0x88);
const i64rotl   = new NumericInstruction(0x89);
const i64rotr   = new NumericInstruction(0x8A);

const f32abs      = new NumericInstruction(0x0B);
const f32neg      = new NumericInstruction(0x8C);
const f32ceil     = new NumericInstruction(0x8D);
const f32floor    = new NumericInstruction(0x8E);
const f32trunc    = new NumericInstruction(0x8F);
const f32nearest  = new NumericInstruction(0x90);
const f32sqrt     = new NumericInstruction(0x91);
const f32add      = new NumericInstruction(0x92);
const f32sub      = new NumericInstruction(0x93);
const f32mul      = new NumericInstruction(0x94);
const f32div      = new NumericInstruction(0x95);
const f32min      = new NumericInstruction(0x96);
const f32max      = new NumericInstruction(0x97);
const f32copysign = new NumericInstruction(0x98);

const f64abs      = new NumericInstruction(0x99);
const f64neg      = new NumericInstruction(0x9A);
const f64ceil     = new NumericInstruction(0x9B);
const f64floor    = new NumericInstruction(0x9C);
const f64trunc    = new NumericInstruction(0x9D);
const f64nearest  = new NumericInstruction(0x9E);
const f64sqrt     = new NumericInstruction(0x9F);
const f64add      = new NumericInstruction(0xA0);
const f64sub      = new NumericInstruction(0xA1);
const f64mul      = new NumericInstruction(0xA2);
const f64div      = new NumericInstruction(0xA3);
const f64min      = new NumericInstruction(0xA4);
const f64max      = new NumericInstruction(0xA5);
const f64copysign = new NumericInstruction(0xA6);

const i32warp_i64        = new NumericInstruction(0xA7);
const i32trunc_f32_s     = new NumericInstruction(0xA8);
const i32trunc_f32_u     = new NumericInstruction(0xA9);
const i32trunc_f64_s     = new NumericInstruction(0xAA);
const i32trunc_f64_u     = new NumericInstruction(0xAB);
const i64extend_i32_s    = new NumericInstruction(0xAC);
const i64extend_i32_u    = new NumericInstruction(0xAD);
const i64trunc_f32_s     = new NumericInstruction(0xAE);
const i64trunc_f32_u     = new NumericInstruction(0xAF);
const i64trunc_f64_s     = new NumericInstruction(0xB0);
const i64trunc_f64_u     = new NumericInstruction(0xB1);
const f32convert_i32_s   = new NumericInstruction(0xB2);
const f32convert_i32_u   = new NumericInstruction(0xB3);
const f32convert_i64_s   = new NumericInstruction(0xB4);
const f32convert_i64_u   = new NumericInstruction(0xB5);
const f32demote_f64      = new NumericInstruction(0xB6);
const f64convert_i32_s   = new NumericInstruction(0xB7);
const f64convert_i32_u   = new NumericInstruction(0xB8);
const f64convert_i64_s   = new NumericInstruction(0xB9);
const f64convert_i64_u   = new NumericInstruction(0xBA);
const f64promote_f32     = new NumericInstruction(0xBB);
const i32reinterpret_f32 = new NumericInstruction(0xBC);
const i64reinterpret_f64 = new NumericInstruction(0xBD);
const f32reinterpret_i32 = new NumericInstruction(0xBE);
const f64reinterpret_i64 = new NumericInstruction(0xBF);

const i32extend8_s   = new NumericInstruction(0xC0);
const i32extend16_s  = new NumericInstruction(0xC1);
const i64extend8_s   = new NumericInstruction(0xC2);
const i64extend16_s  = new NumericInstruction(0xC3);
const i64extend32_s  = new NumericInstruction(0xC4);



const wrapper = {
	i32: {
		eqz  : () => i32eqz,
		eq   : () => i32eq,
		ne   : () => i32ne,
		lt_s : () => i32lt_s,
		lt_u : () => i32lt_u,
		gt_s : () => i32gt_s,
		gt_u : () => i32gt_u,
		le_s : () => i32le_s,
		le_u : () => i32le_u,
		ge_s : () => i32ge_s,
		ge_u : () => i32ge_u,

		clz    : () => i32clz,
		ctz    : () => i32ctz,
		popcnt : () => i32popcnt,
		add    : () => i32add,
		sub    : () => i32sub,
		mul    : () => i32mul,
		div_s  : () => i32div_s,
		div_u  : () => i32div_u,
		rem_s  : () => i32rem_s,
		rem_u  : () => i32rem_u,
		and    : () => i32and,
		or     : () => i32or,
		xor    : () => i32xor,
		shl    : () => i32shl,
		shr_s  : () => i32shr_s,
		shr_u  : () => i32shr_u,
		rotl   : () => i32rotl,
		rotr   : () => i32rotr,

		warp_i64    : () => i32warp_i64,
		trunc_f32_s : () => i32trunc_f32_s,
		trunc_f32_u : () => i32trunc_f32_u,
		trunc_f64_s : () => i32trunc_f64_s,
		trunc_f64_u : () => i32trunc_f64_u,

		extend_8_s       : () => i32extend8_s,
		extend_16_s      : () => i32extend16_s,
		reinterpret_f32 : () => i32reinterpret_f32,
	},
	i64: {
		eqz: () => i64eqz,
		eq: () => i64eq,
		ne: () => i64ne,
		lt_s: () => i64lt_s,
		lt_u: () => i64lt_u,
		gt_s: () => i64gt_s,
		gt_u: () => i64gt_u,
		le_s: () => i64le_s,
		le_u: () => i64le_u,
		ge_s: () => i64ge_s,
		ge_u: () => i64ge_u,

		clz: () => i64clz,
		ctz: () => i64ctz,
		popcnt: () => i64popcnt,
		add: () => i64add,
		sub: () => i64sub,
		mul: () => i64mul,
		div_s: () => i64div_s,
		div_u: () => i64div_u,
		rem_s: () => i64rem_s,
		rem_u: () => i64rem_u,
		and: () => i64and,
		or: () => i64or,
		xor: () => i64xor,
		shl: () => i64shl,
		shr_s: () => i64shr_s,
		shr_u: () => i64shr_u,
		rotl: () => i64rotl,
		rotr: () => i64rotr,

		extend_8_s:  ()=> i64extend8_s,
		extend_16_s: () => i64extend16_s,
		extend_32_s: () => i64extend32_s,
		extend_i32_s: () => i64extend_i32_s,
		extend_i32_u: () => i64extend_i32_u,
		trunc_f32_s: () => i64trunc_f32_s,
		trunc_f32_u: () => i64trunc_f32_u,
		trunc_f64_s: () => i64trunc_f64_s,
		trunc_f64_u: () => i64trunc_f64_u,

		reinterpret_f64: () => i64reinterpret_f64,
	},
	f32: {
		eq : () => f32eq ,
		ne : () => f32ne ,
		lt : () => f32lt ,
		gt : () => f32gt ,
		le : () => f32le ,
		ge : () => f32ge ,

		abs      : () => f32abs     ,
		neg      : () => f32neg     ,
		ceil     : () => f32ceil    ,
		floor    : () => f32floor   ,
		trunc    : () => f32trunc   ,
		nearest  : () => f32nearest ,
		sqrt     : () => f32sqrt    ,
		add      : () => f32add     ,
		sub      : () => f32sub     ,
		mul      : () => f32mul     ,
		div      : () => f32div     ,
		min      : () => f32min     ,
		max      : () => f32max     ,
		copysign : () => f32copysign,

		convert_i32_s   : () => f32convert_i32_s ,
		convert_i32_u   : () => f32convert_i32_u ,
		convert_i64_s   : () => f32convert_i64_s ,
		convert_i64_u   : () => f32convert_i64_u ,
		demote_f64      : () => f32demote_f64    ,
		reinterpret_i32 : () => f32reinterpret_i32,
	},
	f64: {
		eq : () => f64eq ,
		ne : () => f64ne ,
		lt : () => f64lt ,
		gt : () => f64gt ,
		le : () => f64le ,
		ge : () => f64ge ,

		abs      : () => f64abs     ,
		neg      : () => f64neg     ,
		ceil     : () => f64ceil    ,
		floor    : () => f64floor   ,
		trunc    : () => f64trunc   ,
		nearest  : () => f64nearest ,
		sqrt     : () => f64sqrt    ,
		add      : () => f64add     ,
		sub      : () => f64sub     ,
		mul      : () => f64mul     ,
		div      : () => f64div     ,
		min      : () => f64min     ,
		max      : () => f64max     ,
		copysign : () => f64copysign,

		convert_i32_s   : () => f64convert_i32_s ,
		convert_i32_u   : () => f64convert_i32_u ,
		convert_i64_s   : () => f64convert_i64_s ,
		convert_i64_u   : () => f64convert_i64_u ,
		promote_f32     : () => f64promote_f32   ,
		reinterpret_i64 : () => f64reinterpret_i64,
	}
}
export default wrapper;