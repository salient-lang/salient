import { assertEquals, assertThrows } from "https://deno.land/std@0.201.0/assert/mod.ts";

import { EncodeSignedLEB, EncodeUnsignedLEB } from "~/wasm/type.ts";

function toHex(arr: number[]): string {
	return arr.map(x => x.toString(16).padStart(2, "0")).join("");
}

Deno.test("EncodeSignedLEB: zero encoding", () => {
	assertEquals(toHex(EncodeSignedLEB(0)), "00");
});

Deno.test("EncodeSignedLEB: small positive integer", () => {
	assertEquals(toHex(EncodeSignedLEB(8)), "08");
	assertEquals(toHex(EncodeSignedLEB(10)), "0a");
	assertEquals(toHex(EncodeSignedLEB(100)), "e400");
	assertEquals(toHex(EncodeSignedLEB(123456)), "c0c407");
	assertEquals(toHex(EncodeSignedLEB(2141192192)), "808080fd07");
});

Deno.test("EncodeSignedLEB: small negative integer", () => {
	assertEquals(toHex(EncodeSignedLEB(-100)), "9c7f");
});

Deno.test("EncodeSignedLEB: should throw an error for non-integers", () => {
	assertThrows(() => EncodeSignedLEB(12.34));
});

Deno.test("EncodeUnsignedLEB: zero encoding", () => {
	assertEquals(toHex(EncodeUnsignedLEB(0)), "00");
});

Deno.test("EncodeUnsignedLEB: small integer", () => {
	assertEquals(toHex(EncodeUnsignedLEB(1)), "01");
	assertEquals(toHex(EncodeUnsignedLEB(8)), "08");
	assertEquals(toHex(EncodeUnsignedLEB(127)), "7f");
	assertEquals(toHex(EncodeUnsignedLEB(128)), "8001");
	assertEquals(toHex(EncodeUnsignedLEB(255)), "ff01");
	assertEquals(toHex(EncodeUnsignedLEB(256)), "8002");
	assertEquals(toHex(EncodeUnsignedLEB(624485)), "e58e26");
});

Deno.test("EncodeUnsignedLEB: should throw an error for non-integers", () => {
	assertThrows(() => EncodeUnsignedLEB(12.34));
});

Deno.test("EncodeUnsignedLEB: should throw an error for negative integers", () => {
	assertThrows(() => EncodeUnsignedLEB(-12));
});
