import { assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";

import { GetPrecedence } from "~/compiler/codegen/expression/precedence.ts";

Deno.test("Check precedence of two operators", () => {
	assertEquals(GetPrecedence("+", "*"), 1);
	assertEquals(GetPrecedence("+", "-"), 0);
	assertEquals(GetPrecedence("*", "+"), -1);
});