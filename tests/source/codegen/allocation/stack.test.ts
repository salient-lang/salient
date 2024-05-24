/// <reference lib="deno.ns" />
import { assert } from "https://deno.land/std@0.201.0/assert/mod.ts";

import { StackAllocator } from "~/compiler/codegen/allocation/stack.ts"


Deno.test(`Simple Stack Allocation`, () => {
	const stack = new StackAllocator();

	const a = stack.allocate(1, 1); a.tag = "A";
	const b = stack.allocate(4, 1); b.tag = "B";
	const c = stack.allocate(2, 1); c.tag = "C";

	const ptrA = a.getOffset();
	const ptrB = b.getOffset();
	const ptrC = c.getOffset();

	a.free();
	b.free();
	c.free();

	stack.resolve();

	const offA = ptrA.get();
	const offB = ptrB.get();
	const offC = ptrC.get();
	assert(offA < offB);
	assert(offA < offC);
	assert(offB < offC);
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

	// Access them once so they're not omitted
	a.getOffset(); b.getOffset(); c.getOffset(); d.getOffset();

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
	check.restore();

	const c = stack.allocate(2, 1); c.tag = "C";
	a.free();
	c.free();

	// Access them once so they're not omitted
	a.getOffset(); b.getOffset(); c.getOffset();

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
		const checkA = stack.checkpoint();
		const b = stack.allocate(4, 1); b.tag = "B";
		checkA.restore();
	// } else {
		const checkB = stack.checkpoint();
		const c = stack.allocate(1, 1); c.tag = "C";
		const d = stack.allocate(4, 1); d.tag = "D";
		const preAlias = c.getOffset();
		c.moveTo(a);
		checkB.restore();
	// }

	const e = stack.allocate(2, 1); e.tag = "E";

	// Access them once so they're not omitted
	const ptrA = a.getOffset();
	const ptrB = b.getOffset();
	const ptrC = c.getOffset();
	const ptrE = e.getOffset();

	stack.resolve();

	const offA = ptrA.get();
	const offB = ptrB.get();
	const offC = ptrC.get();
	const offE = ptrE.get();

	assert(offA < offB);
	assert(offB > offC);
	assert(offC == offA, "Aliasing correctly moved stack pointer");
	assert(offC < offE);
	assert(offA < offE);

	assert(d.getOffset().isResolved() === false, "D was never accessed so it was omitted");

	assert(offC == preAlias.get(), "Aliasing is applied to gets before the .moveTo() was invoked");
});