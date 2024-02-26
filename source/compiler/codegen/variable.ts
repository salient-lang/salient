import Structure from "~/compiler/structure.ts";
import { RegisterAllocator } from "./allocation/registers.ts";
import { AssertUnreachable } from "~/helper.ts";
import { ReferenceRange } from "~/parser.ts";
import { SolidType } from "~/compiler/codegen/expression/type.ts";
import { Intrinsic } from "~/compiler/intrinsic.ts";
import { Register } from "./allocation/registers.ts";
import { u32 } from "~/compiler/intrinsic.ts";

export enum TypeSystem {
	Affine,
	Normal
}

export type Variable = IntrinsicVariable | StructVariable;

export function MakeVariable(name: string, type: SolidType, register: RegisterAllocator, isArg: boolean, ref: ReferenceRange) {
	if (type instanceof Intrinsic) return new IntrinsicVariable(name, type, register, isArg, ref);
	if (type instanceof Structure) return new StructVariable(name, type, register, isArg, ref);
	AssertUnreachable(type);
}

export class IntrinsicVariable {
	name: string;
	type: Intrinsic;
	storage: TypeSystem;
	register: Register;

	lastDefined: ReferenceRange | null;

	isDefined: boolean;
	isGlobal: boolean;
	isClone: boolean;
	isLocal: boolean;
	modifiedAt: ReferenceRange;


	constructor(name: string, type: Intrinsic, register: RegisterAllocator | Register, isArg: boolean, ref: ReferenceRange) {
		this.name = name;
		this.type = type;
		this.storage    = TypeSystem.Normal;
		this.modifiedAt = ref;
		this.isDefined  = isArg;
		this.isClone    = false;
		this.isGlobal   = false;
		this.isLocal    = !isArg;

		this.register = register instanceof RegisterAllocator
			? register.allocate(type.bitcode, isArg)
			: register;

		this.lastDefined = ref;
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
		this.isLocal  = false;
		this.isClone  = false;
		this.markDefined();
	}

	clone() {
		const clone = new IntrinsicVariable(this.name, this.type, this.register, !this.isLocal, this.modifiedAt);
		clone.lastDefined = this.lastDefined;
		clone.isDefined   = this.isDefined;
		clone.isGlobal    = this.isGlobal;
		clone.isLocal     = false;
		clone.isClone     = true;

		return clone;
	}

	toBinary() {
		return this.register.type;
	}
}


export class StructVariable {
	name: string;
	type: Structure;
	storage: TypeSystem;
	register: Register;

	lastDefined: ReferenceRange | null;

	isDefined: boolean;
	isGlobal: boolean;
	isClone: boolean;
	isLocal: boolean;
	modifiedAt: ReferenceRange;

	mask: { [key: string]: Variable };

	constructor(name: string, type: Structure, register: RegisterAllocator | Register, isArg: boolean, ref: ReferenceRange) {
		this.name = name;
		this.type = type;
		this.storage    = TypeSystem.Normal;
		this.modifiedAt = ref;
		this.isDefined  = false;
		this.isGlobal   = false;
		this.isLocal    = !isArg;
		this.isClone    = false;
		this.mask = {};

		this.register = register instanceof RegisterAllocator
			? register.allocate(u32.bitcode)
			: register;

		// Ensure the type is actually linked
		type.link();

		this.lastDefined = ref;
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
		this.isLocal  = false;
		this.isClone  = false;
		this.markDefined();
	}

	markArgument() {
		this.isGlobal = false;
		this.isLocal  = false;
		this.isClone  = false;
		this.markDefined();
	}

	clone() {
		const clone = new StructVariable(this.name, this.type, this.register, !this.isLocal, this.modifiedAt);
		clone.lastDefined = this.lastDefined;
		clone.isDefined   = this.isDefined;
		clone.isGlobal    = this.isGlobal;
		clone.isLocal     = false;
		clone.isClone     = true;

		return clone;
	}

	toBinary() {
		return this.register.type;
	}
}