import { RegisterAllocator } from "./registers.js";
import { ReferenceRange } from "../../parser.js";
import { Intrinsic } from "../intrinsic.js";
import { Variable } from "./variable.js"

export class Scope {
	register: RegisterAllocator;
	vars: { [key: string]: Variable };

	constructor() {
		this.register = new RegisterAllocator();
		this.vars = {};
	}

	registerArgument(name: string, type: Intrinsic, ref: ReferenceRange) {
		this.vars[name] = new Variable(
			name, type,
			this.register.allocate(type.bitcode),
		ref);

		this.vars[name].markArgument();

		return this.vars[name];
	}
}