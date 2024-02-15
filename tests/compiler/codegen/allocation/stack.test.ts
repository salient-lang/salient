/// <reference lib="deno.ns" />
import { fail, assertNotEquals, assert, assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";

import { StackAllocator } from "~/compiler/codegen/allocation/stack.ts";

Deno.test(`Stack Allocator`, async () => {
	const stack = new StackAllocator();

	const a = stack.allocate(1, 1);
	const b = stack.allocate(4, 1);
	const c = stack.allocate(2, 1);

	stack.resolve();

	console.log(a.getOffset().get());
	console.log(b.getOffset().get());
	console.log(c.getOffset().get());
});