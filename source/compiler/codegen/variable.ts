import { ReferenceRange } from "~/parser.ts";
import { IntrinsicType } from "~/compiler/intrinsic.ts";
import { LinearType } from "~/compiler/codegen/expression/type.ts";
import { Register } from "~/compiler/codegen/allocation/registers.ts";

export type Variable = IntrinsicVariable | StructVariable;

export class IntrinsicVariable {
	name: string;
	type: IntrinsicType;
	register: Register;

	lastDefined: ReferenceRange | null;

	isDefined: boolean;
	isGlobal: boolean;
	isClone: boolean;
	modifiedAt: ReferenceRange;


	constructor(name: string, type: IntrinsicType, register: Register, ref: ReferenceRange) {
		this.name = name;
		this.type = type;
		this.modifiedAt = ref;
		this.isDefined  = false;
		this.isClone    = false;
		this.isGlobal   = false;

		this.register = register;

		this.lastDefined = ref;
	}

	getBaseType() {
		return this.type;
	}

	markDefined() {
		this.lastDefined = null;
		this.isDefined = true;
	}
	markUndefined(ref: ReferenceRange) {
		this.lastDefined = ref;
		this.isDefined = false;
	}

	markGlobal() {
		this.isGlobal = true;
		this.isClone  = false;
		this.markDefined();
	}

	clone() {
		const clone = new IntrinsicVariable(this.name, this.type, this.register, this.modifiedAt);
		clone.lastDefined = this.lastDefined;
		clone.isDefined   = this.isDefined;
		clone.isGlobal    = this.isGlobal;
		clone.isClone     = true;

		return clone;
	}

	cleanup () {
		if (this.isClone) return;
		this.register.free();
	}

	toBinary() {
		return this.register.type;
	}
}


export class StructVariable {
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
		this.type.markAssigned();
	}
	markUndefined(ref: ReferenceRange) {
		this.type.markConsumed(ref);
	}

	markArgument() {
		this.markDefined();
	}

	clone() {
		const clone = new StructVariable(this.name, this.type);
		clone.isClone = true;

		return clone;
	}

	cleanup() {
		if (this.isClone) return;
		this.type.alloc.free();
	}

	// toBinary() {
	// 	return this.register.type;
	// }
}