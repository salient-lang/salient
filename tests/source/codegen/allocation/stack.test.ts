/// <reference lib="deno.ns" />
import { assert } from "https://deno.land/std@0.201.0/assert/mod.ts";

import { StackAllocator } from "~/compiler/codegen/allocation/stack.ts"


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