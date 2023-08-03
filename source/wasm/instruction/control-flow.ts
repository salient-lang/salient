// https://webassembly.github.io/spec/core/binary/instructions.html#control-instructions

import type { Any } from "./index";
import { EncodeU32 } from "../type";
import { Byte } from "../helper";

export class Unreachable {
	toBinary(): Byte[] {
		return [0x00];
	}
}

export class NoOp {
	toBinary(): Byte[] {
		return [0x01];
	}
}

export class Block {
	n: Any[];

	constructor(n?: Any[]) {
		this.n = n ? n : [];
	}

	toBinary(): Byte[] {
		return [
			0x02,
			...this.n.flatMap(x => x.toBinary()),
			0x0b
		];
	}
}

export class Loop {
	n: Any[];

	constructor(n?: Any[]) {
		this.n = n ? n : [];
	}

	toBinary(): Byte[] {
		return [
			0x03,
			...this.n.flatMap(x => x.toBinary()),
			0x0b
		];
	}
}

export class IfBlock {
	true: Any[];
	false: Any[];

	constructor(trueI?: Any[], falseI?: Any[]) {
		this.true  = trueI ?  trueI : [];
		this.false = falseI ? falseI : [];
	}

	toBinary(): Byte[] {
		if (this.false.length > 0) {
			return [
				0x04,
				...this.true.flatMap(x => x.toBinary()),
				0x05,
				...this.false.flatMap(x => x.toBinary()),
				0x0b
			]
		}

		return [
			0x04,
			...this.true.flatMap(x => x.toBinary()),
			0x0b
		];
	}
}



export class Br {
	l: number;

	constructor(labelIdx: number) {
		this.l = labelIdx;
	}

	toBinary(): Byte[] {
		return [
			0x0c,
			...EncodeU32(this.l)
		];
	}
}

export class Br_If {
	l: number;

	constructor(labelIdx: number) {
		this.l = labelIdx;
	}

	toBinary(): Byte[] {
		return [
			0x0d,
			...EncodeU32(this.l)
		];
	}
}


export class Return {
	constructor() {}

	toBinary(): Byte[] {
		return [ 0x0f ];
	}
}