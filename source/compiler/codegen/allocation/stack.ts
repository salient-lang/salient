/// <reference lib="deno.ns" />
import { assert } from "https://deno.land/std@0.201.0/assert/mod.ts";

import { AssertUnreachable, AlignUpInteger, AlignDownInteger, LatentValue } from "~/helper.ts";

/**
 * Used for calculating the relative stack location of variables within a function stack
 *
 * Before branching behaviour a stack.checkpoint must be formed
 * After a branch ends you checkpoint.rewind
 * Then once all branches have been resolved you checkpoint.restore
 *
 * This will boil up any stack values which are originally spawned in a branch, but then continue existing into the parent's stack
 * This will error if any non primary branch has remaining allocations on rewind which have not been aliased to an allocation in the primary stack
 */

class Region {
	head: number;
	tail: number;

	constructor(start: number, end: number) {
		this.head = start;
		this.tail = end;
	}
}

enum StackEventType { allocation, free };
class StackEvent {
	type: StackEventType;
	entity: StackAllocation | StackCheckpoint;
	ignore: boolean;

	constructor(born: StackEventType, entity: StackAllocation | StackCheckpoint) {
		this.type = born;
		this.entity = entity;
		this.ignore = false;
	}
}


class StackCheckpoint {
	private owner: StackAllocator;
	readonly previous?: StackCheckpoint;

	private timeline: StackEvent[];
	private local: StackAllocation[];
	private firstRewind: boolean;

	constructor(owner: StackAllocator, prev?: StackCheckpoint) {
		this.owner = owner;
		this.previous = prev;
		this.firstRewind = true;
		this.timeline = [];
		this.local = [];
	}

	allocate(size: number, align: number) {
		const alloc = new StackAllocation(this, size, align);
		this.timeline.push(new StackEvent(StackEventType.allocation, alloc));
		this.local.push(alloc);

		return alloc;
	}

	free(alloc: StackAllocation) {
		const index = this.local.findIndex(l => l === alloc);
		if (index === -1) throw new Error(`Attempting to free${alloc?.tag ? ` tag[${alloc?.tag}]` : ""} non-local allocation`);

		this.timeline.push(new StackEvent(StackEventType.free, alloc));
		this.local.splice(index, 1);
	}

	private bind(alloc: StackAllocation) {
		this.timeline.push(new StackEvent(StackEventType.allocation, alloc));
		this.local.push(alloc);
		alloc._move(this);
	}

	hasAllocations() {
		return this.local.length > 0;
	}

	getAllocationCount() {
		return this.local.length;
	}

	rewind() {
		if (!this.previous) throw new Error("Cannot rewind root StackCheckpoint");

		if (this.firstRewind) {
			for (const alloc of this.local) {
				if (alloc.isAlias()) continue;

				this.previous.bind(alloc);

				// Ignore the allocation of this in the timeline
				// As it's been pushed up
				for (let i=this.timeline.length-1; 0 <= i; i--) {
					if (this.timeline[i].entity === alloc) {
						this.timeline[i].ignore = true;
						break;
					}
				}
			}
			this.local.length = 0;
		} else {
			for (const alloc of this.local) {
				if (!alloc.isAlias()) throw new Error("Branching allocations not resolved by prior aliasing");
			}
			this.local.length = 0;
		}
	}

	restore() {
		if (this.local.length !== 0) throw new Error("Must run rewind before restore");

		// Merge up timelines
		if (this.previous) {
			for (const evt of this.timeline) {
				if (evt.ignore) continue;
				this.previous.timeline.push(evt);
			}
		}

		this.owner.restore(this);
	}

	events() {
		return this.timeline.values();
	}
}

export class StackAllocator {
	private checkpointRef: StackCheckpoint;
	private latentSize: LatentValue<number>; // Final size of the stack

	constructor() {
		this.checkpointRef = new StackCheckpoint(this);
		this.latentSize = new LatentValue<number>;
	}

	allocate(size: number, align = 1) {
		if (!this.checkpointRef) throw new Error(`StackAllocator state error`);
		return this.checkpointRef.allocate(size, align);
	}

	checkpoint() {
		this.checkpointRef = new StackCheckpoint(this, this.checkpointRef);
		return this.checkpointRef;
	}

	restore(checkpoint: StackCheckpoint) {
		if (this.checkpointRef != checkpoint) throw new Error(`In correct stack checkpoint restore order`);
		if (!checkpoint.previous) throw new Error(`Cannot restore from a root checkpoint`);
		this.checkpointRef = checkpoint.previous;
	}

	getSize() {
		this.resolve();
		return this.latentSize.get();
	}

	getLatentSize() {
		return this.latentSize;
	}

	resolve() {
		if (!this.checkpointRef) return;
		if (this.checkpointRef.hasAllocations()) throw new Error(
			`Stack leak: ${this.checkpointRef.getAllocationCount()} stack values are still allocated after stack frame end`
		);

		const table: Region[] = [];
		let offset = 0;
		let size = 0;

		function allocate(alloc: StackAllocation) {
			// Already allocated, likely due to stack promotion
			if (alloc.inUse) throw new Error("Double allocation on stack allocation");

			// short circuit
			if (alloc.size == 0 || alloc.isAlias()) return offset;

			// Look for the first available region
			for (let i=0; i<table.length; i++) {
				const region = table[i];
				const chunkSize = region.tail - region.head;

				const head = AlignUpInteger(region.head, alloc.align);
				const paddingFront = head - region.head;

				const tail = AlignDownInteger(region.tail-alloc.size, alloc.align);
				const paddingBack = (region.tail-alloc.size) - tail;

				// Won't fit in chunk
				const padding = Math.min(paddingFront, paddingBack);
				if (padding + alloc.size > chunkSize) continue;

				let start, end: number;
				let placed = false;
				if (paddingFront <= paddingBack) {
					start = head;
					end = start + alloc.size

					if (paddingFront == 0) {
						region.head += alloc.size;
						placed = true;
					}
				} else {
					end = tail;
					start = end - alloc.size;

					if (paddingBack == 0) {
						region.tail -= alloc.size;
						placed = true;
					}
				}

				if (!placed) {
					table.splice(i+1, 0, new Region(end, region.tail));
					region.tail = start;
				}

				alloc.getOffset().resolve(start);
				alloc.inUse = true;
				return;
			}

			// Extend the stack to fit the new allocation
			const head = AlignUpInteger(offset, alloc.align);
			const padding = head-offset;
			if (padding > 0) table.push(new Region(offset, head));

			alloc.getOffset().resolve(head);
			alloc.inUse = true;
			offset += alloc.size + padding;
			size = Math.max(size, offset);

		}

		function free(alloc: StackAllocation) {
			if (!alloc.inUse) throw new Error("Double free on stack allocation");
			if (alloc.size == 0 || alloc.isAlias()) return offset;

			const head = alloc.getOffset().get();
			const tail = head + alloc.size;

			if (table.length === 0) {
				table.push(new Region(head, tail));
				return;
			}

			let chunkI = table.findIndex(chunk => chunk.head >= head);
			if (chunkI == -1) chunkI = table.length-1;

			const prev = table[chunkI];
			const next = table[chunkI+1];
			let found = false;
			if (prev.tail === head) {
				prev.tail = tail;
				found = true;
				return;
			}

			if (next && tail === next.head) {
				next.head = head;
				found = true;
			}

			if (found) { // attempt defrag
				if (next && prev.tail == next.head) {
					prev.tail = next.tail;
					table.splice(chunkI+1, 1);
				}
			} else { // make new frag
				table.splice(chunkI+1, 0, new Region(head, tail));
			}
		}

		for (const event of this.checkpointRef.events()) {
			switch (event.type) {
				case StackEventType.allocation: event.entity instanceof StackAllocation && allocate(event.entity); break;
				case StackEventType.free:       event.entity instanceof StackAllocation && free(event.entity); break;
				default: AssertUnreachable(event.type);
			}
		}

		this.latentSize.resolve(size);
	}
}

export class StackAllocation {
	private alias?: StackAllocation;
	private owner: StackCheckpoint;

	private latent: LatentValue<number>;
	readonly align: number;
	readonly size: number;
	inUse: boolean;

	// for debug purposes
	tag?: string;

	constructor(owner: StackCheckpoint, size: number, align: number = 1) {
		this.latent = new LatentValue();
		this.owner = owner;
		this.inUse = true;
		this.alias = undefined;
		this.align = align;
		this.size  = size;
	}

	isAlias() {
		return !!this.alias;
	}

	getOffset() {
		return this.alias
			? this.alias.latent
			: this.latent;
	}

	_move(to: StackCheckpoint) {
		this.owner = to;
	}
	free(): void {
		if (this.alias) throw new Error("Cannot free an aliased allocation, please free the primary");

		this.inUse = false;
		this.owner.free(this);
	}

	makeAlias(of: StackAllocation) {
		// Get to the root
		while (of.alias) of = of.alias;
		this.alias = of;

		if (this.alias.size != this.size) throw new Error("Cannot alias a stack allocation of a different size");
		this.inUse = false;
	}
}





Deno.test(`Simple Stack Allocation`, () => {
	const stack = new StackAllocator();

	const a = stack.allocate(1, 1); a.tag = "A";
	const b = stack.allocate(4, 1); b.tag = "B";
	const c = stack.allocate(2, 1); c.tag = "C";

	a.free();
	b.free();
	c.free();

	stack.resolve();

	a.getOffset().get();
	b.getOffset().get();
	c.getOffset().get();
});

Deno.test(`Region Reuse`, () => {
	const stack = new StackAllocator();

	const a = stack.allocate(1, 1); a.tag = "A";

	const b = stack.allocate(4, 1); b.tag = "B";
	const c = stack.allocate(4, 1); c.tag = "C";
	b.free();

	const d = stack.allocate(2, 1); d.tag = "D";
	a.free();
	c.free();
	d.free();

	stack.resolve();

	const ptrA = a.getOffset().get();
	const ptrB = b.getOffset().get();
	const ptrC = c.getOffset().get();
	const ptrD = d.getOffset().get();
	assert(ptrA < ptrB);
	assert(ptrB < ptrC);
	assert(ptrB == ptrD);
});

Deno.test(`Nested Stack Allocation`, () => {
	const stack = new StackAllocator();

	const a = stack.allocate(1, 1); a.tag = "A";

	const check = stack.checkpoint();
	const b = stack.allocate(4, 1); b.tag = "B";
	b.free();
	check.rewind();
	check.restore();

	const c = stack.allocate(2, 1); c.tag = "C";
	a.free();
	c.free();

	stack.resolve();

	const ptrA = a.getOffset().get();
	const ptrB = b.getOffset().get();
	const ptrC = c.getOffset().get();
	assert(ptrA < ptrB);
	assert(ptrA < ptrC);
	assert(ptrB == ptrC);
});

Deno.test(`Branch Merging`, () => {
	const stack = new StackAllocator();

	const a = stack.allocate(1, 1); a.tag = "A";

	// if {
		const check = stack.checkpoint();
		const b = stack.allocate(4, 1); b.tag = "B";
		const c = stack.allocate(4, 1); c.tag = "C";
		b.free();
		check.rewind();
	// } else {
		const d = stack.allocate(4, 1); d.tag = "D";
		d.makeAlias(c);
		check.rewind();
	// }
	check.restore();

	const e = stack.allocate(2, 1); e.tag = "E";
	a.free();
	e.free();
	c.free();

	stack.resolve();

	const ptrA = a.getOffset().get();
	const ptrB = b.getOffset().get();
	const ptrC = c.getOffset().get();
	const ptrD = d.getOffset().get();
	const ptrE = e.getOffset().get();

	assert(ptrA < ptrB);
	assert(ptrB > ptrC);
	assert(ptrC == ptrD);
	assert(ptrC < ptrE);
	assert(ptrA < ptrE);
});