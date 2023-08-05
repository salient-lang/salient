import { Unreachable, IfBlock, Block, Loop, NoOp, Br, Br_If, Return } from "./control-flow";

import { FuncRef } from "../funcRef";
import { EncodeU32 } from "../type";
import { Byte } from "../helper";

import varFuncs, { Variable } from "./variable";
import constFuncs, { Constant } from "./constant";
import memFuncs, { MemoryRegister } from "./memory";

export class Call {
	x: FuncRef | number;

	constructor(funcRef: FuncRef | number) {
		this.x = funcRef;
	}

	toBinary(): Byte[] {
		return [
			0x10,
			...EncodeU32(this.x instanceof FuncRef ? this.x.getIdentifier() : this.x)
		];
	}
}

export class Drop {
	constructor() {}

	toBinary(): Byte[] {
		return [ 0x1A ];
	}
}

export type Any =
	Unreachable | NoOp | Block | Loop | IfBlock |
	Br_If | Br |
	Return | Call | Drop |
	Constant |
	Variable |
	MemoryRegister;


	const shared_Unreachable = new Unreachable();
	const shared_Return = new Return();
	const shared_Drop = new Drop();
	const shared_NoOp = new NoOp();

const wrapper = {
	const: constFuncs,
	...varFuncs,
	...memFuncs,

	unreachable: () => shared_Unreachable,
	return     : () => shared_Return,
	drop       : () => shared_Drop,
	noop       : () => shared_NoOp,

	block: (n?: Any[])                 => new Block(n),
	br_if: (i: number)                 => new Br_If(i),
	br   : (i: number)                 => new Br(i),
	call : (funcRef: FuncRef | number) => new Call(funcRef),
	if   : (t?: Any[], f?: Any[])      => new IfBlock(t, f),
	loop : (n?: Any[])                 => new Loop(n),
}

export default wrapper;