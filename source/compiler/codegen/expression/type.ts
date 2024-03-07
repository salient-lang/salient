import Structure from "~/compiler/structure.ts";
import { StackAllocation } from "~/compiler/codegen/allocation/stack.ts";
import { Intrinsic } from "~/compiler/intrinsic.ts";
import { Register } from "~/compiler/codegen/allocation/registers.ts";
import { ReferenceRange } from "~/parser.ts";
import { assert } from "https://deno.land/std@0.201.0/assert/assert.ts";

export type SolidType = Intrinsic | Structure;

// deno-lint-ignore no-explicit-any
export function IsSolidType(a: any): a is SolidType {
	if (a instanceof CompositeType) return true;
	if (a instanceof Intrinsic) return true;
	if (a instanceof Structure) return true;

	return false;
}

// deno-lint-ignore no-explicit-any
export function IsContainerType(a: any): boolean {
	if (a instanceof Structure) return true;

	return false;
}

enum BasePointerType { global, local };
export class BasePointer {
	type: BasePointerType;
	id: number;

	constructor(type: BasePointerType, id: number) {
		this.type = type;
		this.id = id;
	}
}

export class LinearType {
	private composable: boolean;
	private parent?: LinearType;

	private consumedAt?: ReferenceRange;

	// Is this a structure made in an expression, not tied to a variable
	// So after use the whole structure needs to be disposed?
	private retain: boolean;

	private attributes: Map<string, LinearType>;
	readonly type: Intrinsic | Structure;

	readonly alloc?: Register | StackAllocation;
	readonly offset: number;
	readonly base?: BasePointer;

	// constructor(a: LinearType['type'], b: LinearType['alloc'], c: BasePointer | undefined)
	// constructor(a: LinearType['type'], b: number, c: LinearType)
	constructor(a: LinearType['type'], b: LinearType['alloc'] | number, c?: BasePointer | LinearType) {
		if (c instanceof LinearType) {
			assert(typeof b === "number", "should be number");

			this.consumedAt = undefined;
			this.composable = true;
			this.retain = false;

			this.parent = c;
			this.type = c.type;
			this.base = c.base;
			this.alloc = c.alloc;
			this.offset = c.offset + b;
		} else {
			assert(typeof b !== "number", "should be alloc");

			this.consumedAt = undefined;
			this.composable = true;
			this.retain = false;

			this.alloc = b;
			this.type = a;
			this.base = c;
			this.offset = 0;
		}

		this.attributes = new Map();
	}

	static make(a: LinearType['type'], b: LinearType['alloc'], c?: BasePointer) {
		return new LinearType(a, b, c);
	}

	static from(parent: LinearType, type: LinearType['type'], offset: number) {
		return new LinearType(type, offset, parent);
	}

	private cascadeCompose() {
		// was already composed, so cascading will make no change
		if (this.composable) return;

		// check all children are composable
		this.composable = true;
		for (const [_, child] of this.attributes) {
			if (!child.composable) {
				this.composable = false;
				return; // stop cascade
			}
		}

		// this item is now composable, cascade up
		this.parent?.cascadeCompose();
	}

	private cascadeDecompose() {
		if (this.composable) this.parent?.cascadeDecompose();
		this.composable = false;
	}

	getCompositionErrors(reasons: ReferenceRange[] = []) {
		if (this.composable) return null;

		if (this.consumedAt) {
			reasons.push(this.consumedAt);
			for (const [_, child] of this.attributes) {
				child.getCompositionErrors(reasons);
			}
		};

		if (reasons.length === 0) return null;

		return reasons;
	}

	markAssigned() {
		this.consumedAt = undefined;
		this.composable = true;
		this.attributes.clear();
	}

	markConsumed(ref: ReferenceRange) {
		this.composable = false;
		this.consumedAt = ref;
		this.attributes.clear();

		this.parent?.cascadeDecompose();
	}

	shouldDispose(): boolean {
		return !this.retain;
	}

	// This value is not stored in a variable, and parents should retain existence after child's consumption
	pin() {
		this.retain = true;
	}

	get(name: string) {
		if (!(this.type instanceof Structure)) throw new Error(`Cannot access linear type on a non-structure`);

		const exist = this.attributes.get(name);
		if (exist) return exist;

		const member = this.type.get(name);
		if (!member) return null;

		const next = LinearType.from(this, member.type, member.offset);
		this.attributes.set(name, next);
		return next;
	}
}

export class CompositeType {
	type: Structure

	constructor(type: Structure) {
		this.type = type;
	}
}