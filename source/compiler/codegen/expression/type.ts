import { assert } from "https://deno.land/std@0.201.0/assert/assert.ts";

import Structure from "~/compiler/structure.ts";
import { IntrinsicValue, IntrinsicType, VirtualType } from "~/compiler/intrinsic.ts";
import { StackAllocation } from "~/compiler/codegen/allocation/stack.ts";
import { ReferenceRange } from "~/parser.ts";
import { LatentOffset } from "~/helper.ts";
import { IsNamespace } from "~/compiler/file.ts";
import { Namespace } from "~/compiler/file.ts";
import { LocalRef } from "~/wasm/funcRef.ts";


export type OperandType = RuntimeType | Namespace | SolidType | VirtualType;
export type RuntimeType = LinearType | IntrinsicValue;
export type SolidType = IntrinsicType | Structure;

// deno-lint-ignore no-explicit-any
export function IsSolidType(a: any): a is SolidType {
	if (a instanceof IntrinsicType) return true;
	if (a instanceof Structure) return true;

	return false;
}

// deno-lint-ignore no-explicit-any
export function IsRuntimeType(a: any): a is RuntimeType {
	if (a instanceof IntrinsicValue) return true;
	if (a instanceof LinearType) return true;

	return false;
}

// deno-lint-ignore no-explicit-any
export function IsContainerType(a: any): boolean {
	if (a instanceof Structure) return true;

	return false;
}




export enum BasePointerType { global, local };
export class BasePointer {
	locality: BasePointerType;
	ref: LocalRef;

	constructor(locality: BasePointerType, ref: LocalRef) {
		this.locality = locality;
		this.ref = ref;
	}

	get () {
		return this.ref.get();
	}
}

export enum Ownership {
	owner,
	loanRead,
	loanWrite
}

export class LinearType {
	private composable: boolean;
	private parent?: LinearType;
	ownership: Ownership;

	private consumedAt?: ReferenceRange;

	// Is this a structure made in an expression, not tied to a variable
	// So after use the whole structure needs to be disposed?
	private retain: boolean;

	private attributes: Map<string, LinearType>;
	readonly type: Structure | IntrinsicValue;

	readonly base: BasePointer;
	readonly alloc: StackAllocation | null;
	/*readonly*/ offset: number | LatentOffset; // edited by clone

	// constructor(type: LinearType['type'], alloc: LinearType['alloc'], base: BasePointer)
	// constructor(type: LinearType['type'], parent: LinearType, offset: LatentOffset)
	constructor(a: LinearType['type'], b: LinearType['alloc'] | LinearType, c: BasePointer | number) {
		if (b instanceof LinearType) {
			assert(typeof c === "number", "should be number");

			this.composable = true;
			this.retain = false;
			this.type = a;

			this.ownership = b.ownership;
			this.parent = b;
			this.base = b.base;
			this.alloc = b.alloc;
			this.offset = (this.parent.offset instanceof LatentOffset)
				? new LatentOffset(this.parent.offset, c)
				: this.parent.offset + c;

			this.consumedAt = b.consumedAt;
		} else {
			assert(c instanceof BasePointer, "should be base pointer");

			this.ownership = Ownership.owner;
			this.consumedAt = undefined;
			this.composable = true;
			this.retain = false;

			this.alloc = b;
			this.type = a;
			this.base = c;
			this.offset = this.alloc
				? new LatentOffset(this.alloc.getOffset(), 0)
				: 0;
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

		if (this.type instanceof Structure) {

			// Not all attributes are present
			if (this.attributes.size < this.type.attributes.length) return;

			// check all children are composable
			this.composable = true;
			for (const [_, child] of this.attributes) {
				if (!child.composable) {
					this.composable = false;
					return; // stop cascade
				}
			}
		}

		// this item is now composable, cascade up
		this.parent?.cascadeCompose();
	}

	private cascadeDecompose() {
		if (this.composable) this.parent?.cascadeDecompose();
	}

	getCompositionErrors(reasons: ReferenceRange[] = []) {
		if (this.composable) return null;

		if (this.consumedAt) {
			const reasonGiven = reasons.findIndex(x => x.start.index === this.consumedAt?.start.index) !== -1;

			// You've been consumed, you have no children
			if (!reasonGiven) reasons.push(this.consumedAt);
			return reasons;
		};

		for (const [_, child] of this.attributes) {
			child.getCompositionErrors(reasons);
		}

		if (reasons.length === 0) return null;

		return reasons;
	}

	hasCompositionErrors() {
		// like getCompositionErrors, but exits on first error

		if (this.composable) return false;
		if (this.consumedAt) return true;

		for (const [_, child] of this.attributes) {
			if (child.hasCompositionErrors()) return true;
		}

		return false;
	}

	markDefined() {
		this.attributes.clear();
		this.consumedAt = undefined;
		this.composable = true;

		this.parent?.cascadeCompose();
	}

	markConsumed(ref: ReferenceRange) {
		this.consumedAt = ref;
		this.composable = false;
		this.attributes.clear();

		this.parent?.cascadeDecompose();
	}

	shouldDispose(): boolean {
		return !this.retain;
	}
	dispose() {
		if (this.retain) return;
		if (!this.alloc) return;
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

	getSize() {
		if (this.type instanceof IntrinsicValue) return this.type.type.size;

		this.type.link();
		return this.type.size;
	}

	getAlignment() {
		if (this.type instanceof IntrinsicValue) return this.type.type.align;

		this.type.link();
		return this.type.align;
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


	infuse(other: LinearType) {
		if (!this.like(other)) throw new Error("Cannot infuse a different type");

		this.composable = other.composable;
		this.consumedAt = other.consumedAt;

		for (const key in this.attributes) {
			if (other.attributes.has(key)) continue;
			this.attributes.delete(key);
		}

		for (const [ key, otherChild ] of other.attributes) {
			this.get(key)?.infuse(otherChild);
		}
	}


	clone(): LinearType {
		const nx = new LinearType(this.type, this.alloc, 0);
		nx.composable = this.composable;
		nx.consumedAt = this.consumedAt;
		nx.parent = this.parent;
		nx.offset = this.offset;
		nx.retain = this.retain;

		for (const [key, value] of this.attributes) {
			if (value instanceof IntrinsicValue) {
				nx.attributes.set(key, value);
			} else {
				nx.attributes.set(key, value.clone());
			}
		}

		return nx;
	}
}