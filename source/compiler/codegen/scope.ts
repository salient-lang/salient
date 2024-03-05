import { RegisterAllocator } from "./allocation/registers.ts";
import { ReferenceRange } from "~/parser.ts";
import { MakeVariable } from "~/compiler/codegen/variable.ts";
import { SolidType } from "~/compiler/codegen/expression/type.ts";
import { TypeSystem } from "~/compiler/codegen/variable.ts"
import { Function } from "~/wasm/function.ts";
import { Variable } from "~/compiler/codegen/variable.ts";
import { StackAllocator } from "~/compiler/codegen/allocation/stack.ts";

export class Scope {
	_parent: Scope | null;
	_localRegs: number;
	register: RegisterAllocator;
	stack:    StackAllocator;
	vars: { [key: string]: Variable };

	constructor(ctx: Function | Scope) {
		this._parent = null;

		if (ctx instanceof Scope) {
			this.register = ctx.register;
			this._localRegs = this.register._regs.length;
			this._parent = ctx;
		} else {
			this.register = new RegisterAllocator(ctx);
		}

		this._localRegs = 0;
		this.stack = new StackAllocator();
		this.vars = {};
	}

	registerArgument(name: string, type: SolidType, ref: ReferenceRange) {
		this.vars[name] = MakeVariable(
			name, type,
			this.register,
			true,
			ref
		);

		this._localRegs = this.register._regs.length;

		return this.vars[name];
	}

	registerVariable(name: string, type: SolidType, ref: ReferenceRange) {
		if (this.vars[name]) return null;

		this.vars[name] = MakeVariable(
			name, type,
			this.register,
			false,
			ref
		);

		return this.vars[name];
	}

	getVariable(name: string, readOnly: boolean): Variable | null {
		if (this.vars[name]) return this.vars[name];

		if (this._parent) {
			const inherited = this._parent.getVariable(name, readOnly);
			if (inherited === null) return null;

			if (readOnly) return inherited;

			// Don't both cloning if the value can't be consumed in this scope
			if (inherited.storage === TypeSystem.Normal) return inherited;

			this.vars[name] = inherited.clone();
		}

		return null;
	}

	child() {
		return new Scope(this);
	}


	cleanup() {
		for (const name in this.vars) {
			if (!this.vars[name].isLocal) continue;
			this.vars[name].register.free();
		}
	}
}