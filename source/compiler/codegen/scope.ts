import Structure from "~/compiler/structure.ts";
import { IntrinsicVariable, StructVariable, Variable } from "~/compiler/codegen/variable.ts";
import { SolidType, LinearType, BasePointer } from "~/compiler/codegen/expression/type.ts";
import { IntrinsicType, IntrinsicValue } from "~/compiler/intrinsic.ts";
import { AssertUnreachable } from "~/helper.ts";
import { RegisterAllocator } from "~/compiler/codegen/allocation/registers.ts";
import { StackAllocator } from "~/compiler/codegen/allocation/stack.ts";
import { ReferenceRange } from "~/parser.ts";
import { Function } from "~/wasm/function.ts";

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
		if (this.vars[name]) throw new Error(`Attempting to rebind variable ${name}`);

		if (type instanceof IntrinsicType) {
			this.vars[name] = new IntrinsicVariable(
				name, type,
				this.register.allocate(type.bitcode, true),
				ref
			);
			this.vars[name].markDefined();
		} else if (type instanceof Structure) {
			const reg = this.register.allocate(type.getBitcode(), true);

			// TODO(@ajanibilby): fix immediately, don't bypass the reg allocator like this
			const linear = LinearType.make(type, null, new BasePointer(type.getBitcode(), this._localRegs));
			this.vars[name] = new StructVariable(name, linear);
			this.vars[name].markDefined();
		} else AssertUnreachable(type);

		this._localRegs = this.register._regs.length;

		return this.vars[name];
	}

	registerVariable(name: string, type: IntrinsicValue | LinearType, ref: ReferenceRange) {
		if (this.vars[name]) throw new Error(`Attempting to rebind variable ${name}`);

		if (type instanceof IntrinsicValue) {
			this.vars[name] = new IntrinsicVariable(
				name, type.type,
				this.register.allocate(type.type.bitcode, false),
				ref
			);
		} else if (type instanceof LinearType) {
			this.vars[name] = new StructVariable(name, type);
		} else AssertUnreachable(type);

		return this.vars[name];
	}

	getVariable(name: string, readOnly: boolean): Variable | null {
		if (this.vars[name]) return this.vars[name];

		if (this._parent) {
			const inherited = this._parent.getVariable(name, readOnly);
			if (inherited === null) return null;

			if (readOnly) return inherited;

			// Don't both cloning if the value can't be consumed in this scope
			if (inherited instanceof LinearType) return inherited;

			this.vars[name] = inherited.clone();
		}

		return null;
	}

	hasVariable(name: string) {
		return !!this.vars[name];
	}

	child() {
		return new Scope(this);
	}

	cleanup() {
		for (const name in this.vars) {
			this.vars[name].cleanup();
		}
	}
}