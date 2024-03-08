import { assert } from "https://deno.land/std@0.201.0/assert/assert.ts";

import Structure from "~/compiler/structure.ts";
import { IntrinsicValue, IntrinsicType, VirtualType } from "~/compiler/intrinsic.ts";
import { StackAllocation } from "~/compiler/codegen/allocation/stack.ts";
import { ReferenceRange } from "~/parser.ts";
import { IsNamespace } from "~/compiler/file.ts";
import { Namespace } from "~/compiler/file.ts";


export type OperandType = LinearType | IntrinsicValue | Namespace | VirtualType;
export type SolidType = IntrinsicType | Structure;

// deno-lint-ignore no-explicit-any
export function IsSolidType(a: any): a is SolidType {
	if (a instanceof IntrinsicType) return true;
	if (a instanceof Structure) return true;

	return false;
}

// deno-lint-ignore no-explicit-any
export function IsContainerType(a: any): boolean {
	if (a instanceof Structure) return true;

	return false;
}

export enum BasePointerType { global, local };
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
	readonly type: Structure | IntrinsicValue;

	readonly alloc: StackAllocation;
	readonly offset: number;
	readonly base: BasePointer;

	// constructor(type: LinearType['type'], alloc: LinearType['alloc'], base: BasePointer)
	// constructor(type: LinearType['type'], parent: LinearType, offset: number)
	constructor(a: LinearType['type'], b: StackAllocation | LinearType, c: BasePointer | number) {
		if (b instanceof LinearType) {
			assert(typeof c === "number", "should be number");

			this.consumedAt = undefined;
			this.composable = true;
			this.retain = false;

			this.parent = b;
			this.type = b.type;
			this.base = b.base;
			this.alloc = b.alloc;
			this.offset = b.offset + c;
		} else {
			assert(c instanceof BasePointer, "should be base pointer");

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

	static make(type: LinearType['type'], alloc: LinearType['alloc'], base: BasePointer) {
		return new LinearType(type, alloc, base);
	}

	static from(parent: LinearType, type: LinearType['type'], offset: number) {
		return new LinearType(type, parent, offset);
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

		const next = LinearType.from(
			this,
			member.type instanceof IntrinsicType ? member.type.value : member.type,
			member.offset
		);
		this.attributes.set(name, next);
		return next;
	}

	getTypeName() {
		if (this.type instanceof Structure) return this.type.name;

		return this.type.getTypeName();
	}

	getBaseType() {
		if (this.type instanceof Structure) return this.type;
		return this.type.type;
	}

	like(other: OperandType): boolean {
		if (other instanceof LinearType) return this.type === other.type;
		if (other instanceof IntrinsicValue) return this.type === other;
		if (other instanceof IntrinsicType)  return this.type === other.value;
		if (IsNamespace(other)) return this.type === other;

		return false;
	}
}