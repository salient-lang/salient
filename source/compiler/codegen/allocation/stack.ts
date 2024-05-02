import { AlignUpInteger, AlignDownInteger } from "~/compiler/helper.ts";
import { AssertUnreachable, LatentValue } from "~/helper.ts";

const DEBUG = true;

class Region {
	head: number;
	tail: number;

	constructor(start: number, end: number) {
		this.head = start;
		this.tail = end;
	}

	clone() {
		return new Region(this.head, this.tail);
	}
}

enum StackEventType { allocation, free };
class StackEvent {
	type:  StackEventType;
	alloc: StackAllocation;

	constructor(type: StackEventType, ref: StackAllocation) {
		this.type = type;
		this.alloc  = ref;
	}
}

class StackBranch {
	paths: StackScope[];

	constructor (paths: StackBranch['paths']) {
		this.paths = paths;
	}
}


class StackScope {
	private parent: StackScope | null;
	private ctx: StackAllocator;

	private timeline: Array<StackEvent | StackScope | StackBranch>;

	// only used when DEBUG === true
	// used to check for:
	//   - allocation when allocated before
	//   - use after free
	//   - free after free
	private local: StackAllocation[];

	constructor(ctx: StackScope['ctx'], parent: StackScope['parent']) {
		this.ctx = ctx;
		this.parent = parent;

		this.timeline = [];
		this.local = [];
	}

	isParentAllocated(alloc: StackAllocation): boolean {
		if (!this.parent) return false;

		for (const a of this.local) {
			if (alloc === a) return true;
		}

		return this.parent.isParentAllocated(alloc);
	}

	allocate(size: number, align = 1) {
		const alloc = new StackAllocation(this, size, align);

		this.timeline.push(new StackEvent(StackEventType.allocation, alloc));
		this.local.push(alloc);

		return alloc;
	}

	free(alloc: StackAllocation) {
		this.timeline.push(new StackEvent(StackEventType.free, alloc));

		if (!DEBUG) return;
		const index = this.local.findIndex(x => x === alloc);
		if (index === -1) {
			if (this.isParentAllocated(alloc)) console.error(new Error(`Attempting to free a parent's allocation (tag:${alloc.tag})`));
			else console.error(new Error(`Attempting to free a non-allocated allocation (tag:${alloc.tag})`));
		} else {
			this.local.splice(index, 1);
		}
	}

	checkpoint () {
		const child = new StackScope(this.ctx, this);

		this.timeline.push(child);
		this.ctx.scope(child);

		return child;
	}

	restore() {
		// Free items in reverse to make splicing more efficient
		for (let i=this.local.length-1; 0<=i; i--) {
			const remain = this.local[i];
			this.free(remain);
		}

		if (this.parent) this.ctx.scope(this.parent);;
	}

	branch (n: number) {
		if (n < 2) throw new Error(`Cannot branch ${n} times`);

		const paths = new Array<StackScope>();
		for (let i=0; i<n; i++) {
			paths.push(new StackScope(this.ctx, this));
		}

		this.timeline.push(new StackBranch(paths));
	}

	events() {
		return this.timeline.values();
	}
}



export class StackAllocator {
	private entry: StackScope;
	private current: StackScope;

	readonly latentSize: LatentValue<number>;

	constructor () {
		this.entry = new StackScope(this, null);
		this.current = this.entry;
		this.latentSize = new LatentValue();
	}

	allocate(size: number, align = 1) {
		return this.current.allocate(size, align);
	}

	free(alloc: StackAllocation) {
		this.current.free(alloc);
	}

	checkpoint() {
		return this.current.checkpoint();
	}

	branch(n: number) {
		return this.current.branch(n);
	}

	scope(ctx: StackScope) {
		this.current = ctx;
	}

	resolve() {
		// Ensure all allocs are freed
		this.entry.restore();

		const mem = new MemoryTable();
		ResolveStack(mem, this.entry);

		this.latentSize.resolve(mem.size);
	}
}

export class StackAllocation {
	readonly ctx: StackScope;

	private latent: LatentValue<number>;
	private accessed: boolean;
	private alias?: StackAllocation;

	align: number;
	size: number;

	// for debug purposes
	tag?: string;

	constructor(ctx: StackAllocation['ctx'], size: number, align: number = 1) {
		this.ctx = ctx;
		this.latent = new LatentValue();

		this.accessed = false; // was this allocation ever actually used?
		this.align    = align;
		this.size     = size;
	}

	wasAccessed() {
		if (this.alias) return false;
		return this.accessed;
	}

	isAlias() {
		return !!this.alias;
	}

	moveTo(other: StackAllocation) {
		if (this.alias) throw new Error("Stack allocation already moved");

		if (other.size < this.size) throw new Error(`Cannot move stack allocation size:${this.size} to size:${other.size}`);

		this.alias = other;

		// remap for any getOffset already performed
		this.latent.resolveTo(other.latent);

		if (this.accessed) other.accessed = true;
	}

	getOffset(): LatentValue<number> {
		if (this.alias) return this.alias.getOffset();

		this.accessed = true;
		return this.latent;
	}

	free(): void {
		this.ctx.free(this);
	}
}





class MemoryTable {
	// only used when DEBUG === true
	//   check if any allocations were made, but not freed
	active : number; // number of allocations

	table  : Array<Region>; // denote the empty region in the stack
	offset : number; // the current length of the stack (i.e. offset to the end)
	size   : number; // the maximum amount offset grew to

	constructor () {
		this.table  = [ new Region(0,0) ];
		this.active = 0;
		this.offset = 0;
		this.size   = 0;
	}

	// Extend the memory table to it matches the domain of the argument
	fit(ref: MemoryTable) {
		if (ref.size <= this.size) return; // no-op

		const last = this.table[this.table.length-1];
		if (last.tail === this.size) { // extend last region
			last.tail = ref.size;
		} else {                       // add new tail region
			this.table.push(new Region(this.size, ref.size));
		}

		this.size = ref.size;
	}

	clone () {
		const out = new MemoryTable();
		out.table  = this.table.map(r => r.clone());
		out.offset = this.offset;
		out.size   = this.size;
		out.active = 0;

		return out;
	}
}

function ResolveStack(mem: MemoryTable, scope: StackScope): void {
	for (const evt of scope.events()) {
		if (evt instanceof StackEvent) {
			// Ignore never accessed allocations
			if (!evt.alloc.wasAccessed()) continue;

			switch (evt.type) {
				case StackEventType.allocation: {
					const offset = Allocate(mem, evt.alloc.size, evt.alloc.align);
					evt.alloc.getOffset().resolve(offset);
					break;
				}
				case StackEventType.free: {
					Free(mem, evt.alloc);
					break;
				}
				default: throw "how can TS not assert if this is unreachable?";
			}

			continue;
		} else if (evt instanceof StackBranch) {
			for (const path of evt.paths) {
				const child = mem.clone();
				ResolveStack(child, path);
				mem.fit(child);
			}
		} else if (evt instanceof StackScope) {
			const child = mem.clone();
			ResolveStack(child, evt);
			mem.fit(child);
		}
	}

	if (DEBUG && mem.active !== 0) console.warn(`Warn: Stack leak detected, ${mem.active} allocations not freed`);
}

function Allocate(mem: MemoryTable, size: number, align: number): number {
	mem.active++;

	// Double allocation aren't possible because user-facing `allocate` always makes a new object

	// short circuit
	if (size == 0) return 0;

	// Look for the first available region
	for (let i=0; i<mem.table.length; i++) {
		const region = mem.table[i];
		const chunkSize = region.tail - region.head;

		const head = AlignUpInteger(region.head, align);
		const paddingFront = head - region.head;

		const tail = AlignDownInteger(region.tail-size, align);
		const paddingBack = (region.tail-size) - tail;

		// Won't fit in chunk
		const padding = Math.min(paddingFront, paddingBack);
		if (padding + size > chunkSize) continue;

		let start, end: number;
		let placed = false;
		if (paddingFront <= paddingBack) {
			start = head;
			end = start + size

			if (paddingFront == 0) {
				region.head += size;
				placed = true;
			}
		} else {
			end = tail;
			start = end - size;

			if (paddingBack == 0) {
				region.tail -= size;
				placed = true;
			}
		}

		if (!placed) {
			mem.table.splice(i+1, 0, new Region(end, region.tail));
			region.tail = start;
		}

		return start;
	}

	// Add padding to the end of the stack if necessary
	const head = AlignUpInteger(mem.offset, align);
	const padding = head-mem.offset;
	if (padding > 0) mem.table.push(new Region(mem.offset, head));

	// Extend the stack to fit the new allocation
	mem.offset += size + padding;
	mem.size = Math.max(mem.size, mem.offset);

	return head;
}


function Free(mem: MemoryTable, alloc: StackAllocation): void {
	mem.active--;

	// Double free checks already ran in StackScope.free

	// short circuit
	if (alloc.size == 0) return;

	const head = alloc.getOffset().get();
	const tail = head + alloc.size;

	if (mem.table.length === 0) {
		mem.table.push(new Region(head, tail));
		return;
	}

	let chunkI = mem.table.findIndex(chunk => chunk.head >= head);
	if (chunkI == -1) chunkI = mem.table.length-1;

	const prev = mem.table[chunkI];
	const next = mem.table[chunkI+1];
	if (prev.tail === head) {
		prev.tail = tail;
		return;
	}

	if (next && tail === next.head) {
		next.head = head;

		// attempt defrag
		if (next && prev.tail == next.head) {
			prev.tail = next.tail;
			mem.table.splice(chunkI+1, 1);
		}

		return;
	}

	mem.table.splice(chunkI+1, 0, new Region(head, tail));
}