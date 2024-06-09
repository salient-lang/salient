import { Unreachable, IfBlock, Block, Loop, NoOp, Br, Br_If, Return } from "~/wasm/instruction/control-flow.ts";

import { EncodeU32 } from "~/wasm/type.ts";
import { FuncRef } from "~/wasm/funcRef.ts";
import { Byte } from "~/helper.ts";

import numFuncs,   { NumericInstruction } from "~/wasm/instruction/numeric.ts";
import memFuncs,   { MemoryRegister } from "~/wasm/instruction/memory.ts";
import constFuncs, { Constant } from "~/wasm/instruction/constant.ts";
import varFuncs,   { Variable } from "~/wasm/instruction/variable.ts";

export class Call {
	x: FuncRef | number;

	constructor(funcRef: FuncRef | number) {
		this.x = funcRef;
	}

	toBinary(): Byte[] {
		return [
			0x10,
			...EncodeU32(this.x instanceof FuncRef ? this.x.get() : this.x)
		];
	}
}

export class ReturnCall {
	x: FuncRef | number;

	constructor(funcRef: FuncRef | number) {
		this.x = funcRef;
	}

	toBinary(): Byte[] {
		return [
			0x12,
			...EncodeU32(this.x instanceof FuncRef ? this.x.get() : this.x)
		];
	}
}

export class Drop {
	constructor() {}

	toBinary(): Byte[] {
		return [ 0x1A ];
	}
}

export type Any = Unreachable | NoOp
	| Block | Loop | IfBlock
	| Br_If | Br
	| Return | Call | Drop
	| Constant
	| Variable
	| MemoryRegister
	| NumericInstruction;


const shared_Unreachable = new Unreachable();
const shared_Return = new Return();
const shared_Drop = new Drop();
const shared_NoOp = new NoOp();

const wrapper = {
	const: constFuncs,
	...varFuncs,
	i32: {
		const: constFuncs.i32,
		...memFuncs.i32,
		...numFuncs.i32,
	},
	i64: {
		const: constFuncs.i64,
		...memFuncs.i64,
		...numFuncs.i64,
	},
	f32: {
		const: constFuncs.f32,
		...numFuncs.f32,
		...memFuncs.f32,
	},
	f64: {
		const: constFuncs.f64,
		...numFuncs.f64,
		...memFuncs.f64,
	},

	unreachable: () => shared_Unreachable,
	return     : () => shared_Return,
	drop       : () => shared_Drop,
	noop       : () => shared_NoOp,

	copy: memFuncs.copy,
	fill: memFuncs.fill,

	block: (typeIdx: number, n?: Any[])                 => new Block(typeIdx, n),
	if   : (typeIdx: number, t?: Any[], f?: Any[])      => new IfBlock(typeIdx, t, f),
	loop : (typeIdx: number, n?: Any[])                 => new Loop(typeIdx, n),
	return_call : (funcRef: FuncRef | number) => new ReturnCall(funcRef),
	call : (funcRef: FuncRef | number) => new Call(funcRef),
	br_if: (i: number)                 => new Br_If(i),
	br   : (i: number)                 => new Br(i),
}

export default wrapper;