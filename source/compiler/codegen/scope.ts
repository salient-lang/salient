import { RegisterAllocator } from "./registers.js";
import { ReferenceRange } from "../../parser.js";
import { Intrinsic } from "../intrinsic.js";
import { Variable } from "./variable.js"
import { Function } from "../../wasm/function.js";

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
		this.vars[name] = new Variable(
			name, type,
			this.register.allocate(type.bitcode),
		ref);

		return this.vars[name];
	}
}