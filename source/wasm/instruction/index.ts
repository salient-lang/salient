import { Unreachable, IfBlock, Block, Loop, NoOp, Br, Br_If, Return } from "./control-flow";

import { FuncRef } from "../funcRef";
import { EncodeU32 } from "../type";
import { Byte } from "../helper";

import Variable, { GetLocal, SetLocal, TeeLocal, GetGlobal, SetGlobal } from "./variable";

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
	GetLocal | SetLocal | TeeLocal | GetGlobal | SetGlobal;

export {
	Unreachable,
	IfBlock,
	Block,
	Loop,
	NoOp,

	Br_If,
	Br,

	GetGlobal, GetLocal, SetGlobal, SetLocal, TeeLocal

	// Select,
}

const wrapper = {
	...Variable,

	unreachable: Unreachable,
	noop: NoOp,
	block: Block,
	loop: Loop,
	if: IfBlock,
	br: Br,
	br_if: Br_If,
	return: Return,
	call: Call,
	drop: Drop,
}

export default wrapper;