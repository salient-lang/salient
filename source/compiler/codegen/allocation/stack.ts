class Region {
	head: number;
	tail: number;

	constructor(start: number, end: number) {
		this.head = start;
		this.tail = end;
	}
}


export class StackAllocator {
	private table: Array<Region>;
	private offset: number;
	size: number;

	constructor() {
		this.table = [];
		this.offset = 0;
		this.size = 0;
	}

	private alloc(size: number): number {
		// Look for an available region
		let chunkSize = Infinity;
		let chunk: Region | null = null;
		for (const region of this.table) {
			const trySize = region.tail - region.head;
			if (size <= trySize && trySize < chunkSize) {
				chunkSize = trySize;
				chunk = region;
			}
		}

		// Place new allocation in the front of the region
		if (chunk) {
			const offset = chunk.head;
			chunk.head += size;
			return offset;
		}

		// Extend the stack to fit the new allocation
		const offset = this.offset;
		this.offset += size;
		this.size = Math.max(this.size, this.offset);
		return offset;
	}

	allocate(size: number) {
		return new StackAllocation(this, this.alloc(size), size);
	}

	reAlloc(alloc: StackAllocation) {
		if (alloc.offset < this.offset) throw new Error("Cannot promote an allocation which is already on the current stack");
		if (alloc.isAlias()) throw new Error("Cannot promote an allocation alias");

		alloc.offset = this.alloc(alloc.size);
	}

	free(alloc: StackAllocation) {
		const head = alloc.offset;
		const tail = alloc.offset + alloc.size;

		if (tail === this.offset) {
			this.offset -= alloc.size;
			this.shrink(false);
			return;
		}

		for (let i=0; i<this.table.length; i++) {
			const chunk = this.table[i];
			if (tail === chunk.head) {
				chunk.head = head;
				this.shrink(true);
			} else if (chunk.tail === head) {
				chunk.tail = tail;
				this.shrink(true);
			}
		}
	}

	// Get the current end of the stack
	probe() {
		return this.offset;
	}

	private shrink(full: boolean) {
		// remove empty regions at the end of the stack
		for (let i=this.table.length-1; 0<=i; i--) {
			const curr = this.table[i];
			if (curr.tail < this.offset) break;

			this.offset = curr.head;
			this.table.pop();
		}

		if (!full) return;

		const swap = Array<Region>();
		for (let i=0; i<this.table.length; i++) {
			const curr = this.table[i];
			if (i == this.table.length-1) {
				swap.push(curr);
				break;
			}

			const next = this.table[i+1];
			// merge next chunk with curr, omit curr
			if (curr.tail == next.head) {
				next.head = curr.head;
				continue;
			}
		}

		this.table = swap;
	}
}

export class StackAllocation {
	private alias?: StackAllocation;
	owner: StackAllocator;
	offset: number;
	size: number;

	constructor(owner: StackAllocator, offset: number, size: number) {
		this.owner = owner;
		this.offset = offset;
		this.alias = undefined;
		this.size = size;
	}

	isAlias() {
		return !!this.alias;
	}

	free(): void {
		if (this.alias) return this.alias.free();
		this.owner.free(this);
	}

	promote(): void {
		if (this.alias) return this.alias.promote();

		// Reallocate it's position forwards
		this.free();
		this.owner.reAlloc(this);
	}

	makeAlias(of: StackAllocation) {
		// Get to the root
		while (of.alias) of = of.alias;
		this.alias = of;

		if (this.alias.size != this.size) throw new Error("Cannot alias a stack allocation of a different size");
	}
}