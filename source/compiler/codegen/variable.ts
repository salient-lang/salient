import { ReferenceRange } from "../../parser.js";
import { Intrinsic } from "../intrinsic.js";
import { Register } from "./registers.js";

export enum TypeSystem {
	Affine,
	Normal
}

export class Variable {
	name: string;
	type: Intrinsic;
	storage: TypeSystem;
	register: Register;

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
	}

	markDefined() {
		this.isDefined = true;
	}

	markGlobal() {
		this.isGlobal = true;
		this.isLocal  = false;
		this.isClone  = false;
	}

	markArgument() {
		this.isGlobal = false;
		this.isLocal  = false;
		this.isClone  = false;
	}

	toBinary() {
		return this.type.bitcode;
	}
}