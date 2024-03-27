import Structure from "~/compiler/structure.ts";
import { SolidType, LinearType, BasePointer, BasePointerType } from "~/compiler/codegen/expression/type.ts";
import { AssertUnreachable } from "~/helper.ts";
import { RegisterAllocator } from "~/compiler/codegen/allocation/registers.ts";
import { StackAllocator } from "~/compiler/codegen/allocation/stack.ts";
import { ReferenceRange } from "~/parser.ts";
import { IntrinsicType } from "~/compiler/intrinsic.ts";
import { Instruction } from "~/wasm/index.ts";
import { Variable } from "~/compiler/codegen/variable.ts";
import { Function } from "~/wasm/function.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Store } from "~/compiler/codegen/expression/helper.ts";

export class Scope {
	_parent: Scope | null;
	register: RegisterAllocator;
	stack:    StackAllocator;
	vars: { [key: string]: Variable };

	constructor(ctx: Function | Scope) {
		this._parent = null;

		if (ctx instanceof Scope) {
			this.register = ctx.register;
			this._parent = ctx;
			this.stack = ctx.stack;
		} else {
			this.register = new RegisterAllocator(ctx);
			this.stack = new StackAllocator();
		}

		this.vars = {};
	}

	registerArgument(ctx: Context, name: string, type: SolidType, ref: ReferenceRange) {
		if (this.vars[name]) throw new Error(`Attempting to rebind variable ${name}`);

		if (type instanceof IntrinsicType) {
			const reg = this.register.allocate(type.bitcode, true);
			const alloc = this.stack.allocate(type.size, type.align);
			alloc.tag = name;

			const linear = LinearType.make(type.value, alloc, ctx.file.owner.project.stackBase);
			this.vars[name] = new Variable(name, linear);
			this.vars[name].markDefined();

			// address
			ctx.block.push(Instruction.global.get(ctx.file.owner.project.stackReg.ref));
			// value
			ctx.block.push(Instruction.local.get(reg.ref));
			Store(ctx, type, linear.offset, ref);

			this.vars[name] = new Variable(name, linear);
			reg.free();
		} else if (type instanceof Structure) {
			const reg = this.register.allocate(type.getBitcode(), true);

			const linear = LinearType.make(type, null, new BasePointer(BasePointerType.local, reg.ref));
			this.vars[name] = new Variable(name, linear);
		} else AssertUnreachable(type);

		this.vars[name].markDefined();
		this.vars[name].type.pin();

		return this.vars[name];
	}

	registerVariable(name: string, type: LinearType, ref: ReferenceRange) {
		if (this.vars[name]) throw new Error(`Attempting to rebind variable ${name}`);

		this.vars[name] = new Variable(name, type);
		this.vars[name].type.pin();
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

	cleanup(recursive: boolean = false) {
		for (const name in this.vars) {
			this.vars[name].cleanup();
		}

		if (recursive) this._parent?.cleanup(recursive);
	}
}