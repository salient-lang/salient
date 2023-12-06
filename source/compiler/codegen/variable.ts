import { ReferenceRange } from "~/parser.ts";
import { Intrinsic } from "~/compiler/intrinsic.ts";
import { Register } from "~/compiler/codegen/registers.ts";

export enum TypeSystem {
	Affine,
	Normal
}

export class Variable {
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


	constructor(name: string, type: Intrinsic, register: Register, ref: ReferenceRange) {
		this.name = name;
		this.type = type;
		this.storage    = (type instanceof Intrinsic) ? TypeSystem.Normal : TypeSystem.Affine;
		this.register   = register;
		this.modifiedAt = ref;
		this.isDefined  = false;
		this.isGlobal   = false;
		this.isLocal    = false;
		this.isClone    = false;

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

	toBinary() {
		return this.type.bitcode;
	}
}