import { ReferenceRange } from "~/parser.ts";
import { LinearType } from "~/compiler/codegen/expression/type.ts";

export class Variable {
	name: string;
	type: LinearType;

	isClone: boolean;

	constructor(name: string, type: LinearType) {
		this.name = name;
		this.type = type;
		this.isClone    = false;
	}

	getBaseType() {
		return this.type.getBaseType();
	}

	markDefined() {
		this.type.markDefined();
	}
	markUndefined(ref: ReferenceRange) {
		this.type.markConsumed(ref);
	}

	markArgument() {
		this.markDefined();
	}

	clone() {
		const clone = new Variable(this.name, this.type.clone());
		clone.isClone = true;

		return clone;
	}

	cleanup() {
		if (this.isClone) return;
		if (this.type.alloc) this.type.alloc.free();
	}

	// toBinary() {
	// 	return this.register.type;
	// }
}