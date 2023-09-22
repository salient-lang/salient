import { RegisterAllocator } from "./registers.ts";
import { ReferenceRange } from "../../parser.ts";
import { Intrinsic } from "../intrinsic.ts";
import { Function } from "../../wasm/function.ts";
import { Variable } from "./variable.ts"
import { Context } from "./context.ts";

export class Scope {
	_localRegs: number;
	register: RegisterAllocator;
	vars: { [key: string]: Variable };

	constructor(input: Function | RegisterAllocator) {
		if (input instanceof RegisterAllocator) {
			this.register = input;
			this._localRegs = this.register._regs.length;
		} else {
			this.register = new RegisterAllocator(input);
		}

		this.vars = {};
		this._localRegs = 0;
	}

	registerArgument(name: string, type: Intrinsic, ref: ReferenceRange) {
		this.vars[name] = new Variable(
			name, type,
			this.register.allocate(type.bitcode, true),
		ref);

		this.vars[name].markArgument();
		this._localRegs = this.register._regs.length;

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

	getVariable(name: string) {
		return this.vars[name] || null;
	}

	child() {
		const out = new Scope(this.register);
		out._localRegs = this.register._regs.length;
		out.vars = this.vars;

		return out;
	}


	cleanup(ctx: Context) {
		for (let i=this._localRegs; i<this.register._regs.length; i++) {
			this.register._regs[i].free();
		}
	}
}