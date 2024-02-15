import { AssertUnreachable, LatentValue } from "~/helper.ts";

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

enum StackEventType { allocation, free, branch };
class StackEvent {
	type: StackEventType;
	entity: StackAllocation | StackCheckpoint;

	constructor(born: StackEventType, entity: StackAllocation | StackCheckpoint) {
		this.type = born;
		this.entity = entity;
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

		return alloc;
	}

	free(alloc: StackAllocation) {
		const index = this.local.findIndex(l => l === alloc);
		if (index !== -1) this.local.splice(index, 1);

		this.timeline.push(new StackEvent(StackEventType.free, alloc));
	}

	private bind(alloc: StackAllocation) {
		this.timeline.push(new StackEvent(StackEventType.allocation, alloc))
	}

	events() {
		return this.timeline.values();
	}

	rewind() {
		if (!this.previous) throw new Error("Cannot rewind root StackCheckpoint");

		if (this.firstRewind) {
			for (const alloc of this.local) {
				if (alloc.isAlias()) continue;
				this.previous.bind(alloc);
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
		this.owner.restore(this);
	}
}

export class StackAllocator {
	private checkpointRef?: StackCheckpoint;

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
		return new StackCheckpoint(this, this.checkpointRef);
	}

	restore(checkpoint: StackCheckpoint) {
		if (this.checkpointRef != checkpoint) throw new Error(`In correct stack checkpoint restore order`);
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

		const table = new Array<Region>();
		let offset = 0;
		let size = 0;

		function allocate(alloc: StackAllocation) {
			// Already allocated, likely due to stack promotion
			if (alloc.inUse) return;

			// short circuit
			if (alloc.size == 0 || alloc.isAlias()) return offset;

			// Look for an available region
			let chunkSize = Infinity;
			let chunk: Region | null = null;
			for (const region of table) {
				const trySize = region.tail - region.head;
				if (alloc.size <= trySize && trySize < chunkSize) {
					chunkSize = trySize;
					chunk = region;
				}
			}

			// Place new allocation in the front of the region
			if (chunk) {
				alloc.getOffset().resolve(chunk.head);
				chunk.head += size;
			}

			// Extend the stack to fit the new allocation
			const ptr = offset;
			offset += alloc.size;
			size = Math.max(size, offset);
			return ptr;
		}

		function free(alloc: StackAllocation) {
			if (!alloc.inUse) throw new Error("Double free on stack allocation")
			if (alloc.size == 0 || alloc.isAlias()) return offset;

			const head = alloc.getOffset().get();
			const tail = head + alloc.size;

			for (let i=0; i<table.length; i++) {
				const chunk = table[i];
				if (tail === chunk.head) {
					chunk.head = head;

					// Now overlaps with prev free region
					const prev = table[i-1];
					if (prev && prev.tail >= chunk.head) {
						chunk.tail = prev.tail;
						table.splice(i-1, 1);
					}
				} else if (chunk.tail === head) {
					chunk.tail = tail;

					// Now overlaps with next free region
					const next = table[i+1];
					if (next && chunk.head >= next.head) {
						chunk.tail = next.tail;
						table.splice(i+1, 1);
					}
				}
			}
		}

		function recurse(timeline: IterableIterator<StackEvent>) {
			for (const event of timeline) {
				switch (event.type) {
					case StackEventType.allocation: event.entity instanceof StackAllocation && allocate(event.entity); break;
					case StackEventType.free:       event.entity instanceof StackAllocation && free(event.entity); break;
					case StackEventType.branch:     event.entity instanceof StackCheckpoint && recurse(event.entity.events());
						break;
					default: AssertUnreachable(event.type);
				}
			}
		}
		recurse(this.checkpointRef.events());

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