import { RegisterAllocator } from "./registers.ts";
import { ReferenceRange } from "../../parser.ts";
import { Intrinsic } from "../intrinsic.ts";
import { Variable } from "./variable.ts"
import { Function } from "../../wasm/function.ts";

export class Scope {
	register: RegisterAllocator;
	vars: { [key: string]: Variable };

	constructor(func: Function) {
		this.register = new RegisterAllocator(func);
		this.vars = {};
	}

	registerArgument(name: string, type: Intrinsic, ref: ReferenceRange) {
		this.vars[name] = new Variable(
			name, type,
			this.register.allocate(type.bitcode, true),
		ref);

		this.vars[name].markArgument();

		return this.vars[name];
	}

	registerVariable(name: string, type: Intrinsic, ref: ReferenceRange) {
		if (this.vars[name]) return null;

		this.vars[name] = new Variable(
			name, type,
			this.register.allocate(type.bitcode),
		ref);

		return this.vars[name];
	}
}