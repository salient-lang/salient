/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";

import type { Term_Expr, Term_Expr_arg, _Literal } from "~/bnf/syntax.d.ts";
import { ReferenceRange } from "~/parser.ts";


const precedence = {
	"->": 1,
	"*" : 3, "/" : 3, "%" : 3,
	"+" : 4, "-" : 4,
	"<<": 5, ">>": 5,
	"<" : 6, ">" : 6, "<=": 6, ">=": 6,
	"instanceof": 6.5,
	"==": 7, "!=": 7,
	"as": 7.5,
	"&": 8,
	"^": 9,
	"|": 10,
	"&&": 11,
	"||": 12,
} as { [key: string]: number };

function GetPrecedence (a: string, b: string) {
	const A = precedence[a];
	const B = precedence[b];
	if (A == undefined && B == undefined) {
		return 0;
	} else if (A == B) {
		return 0;
	} else if (B == undefined) {
		return 1;
	} else if (A == undefined) {
		return -1;
	} else {
		return Math.min(1, Math.max(-1, A-B));
	}
}

export type PrecedenceTree = Term_Expr_arg | {
	type: "infix",
	lhs : PrecedenceTree,
	op  : string,
	rhs : PrecedenceTree,
	ref : ReferenceRange
};

export function ApplyPrecedence(syntax: Term_Expr) {
	let root: PrecedenceTree = syntax.value[0] as PrecedenceTree;

	for (const action of syntax.value[1].value) {
		const op = action.value[0].value;
		const arg       = action.value[1]

		// First action
		if (!Array.isArray(root)) {
			root = {
				type: "infix",
				lhs: root,
				op,
				rhs: arg,
				ref: ReferenceRange.union(root.ref, arg.ref)
			};
			continue;
		}

		const p = GetPrecedence(root[1], op);
		if (p > 0) {
			// Transform stealing previous operand
			// (1 + 2) * 3 -> (2 * 3) + 1
			root = {
				type: "infix",
				lhs: {
					type: "infix",
					lhs: root[2],
					op,
					rhs: arg,
					ref: ReferenceRange.union(root[2].ref, arg.ref)
				},
				op: root[1],
				rhs: root[0],
				ref: ReferenceRange.union(arg.ref, arg.ref)
			}

		} else {
			root = {
				type: "infix",
				lhs: root[0],
				op:  root[1],
				rhs: {
					type: "infix",
					lhs: root[2],
					op,
					rhs: arg,
					ref: ReferenceRange.union(root[2].ref, arg.ref)
				},
				ref: ReferenceRange.union(root[0].ref, arg.ref)
			}
		}
	}

	return root;
}

Deno.test("Check precedence of two operators", () => {
	assertEquals(GetPrecedence("+", "*"), 1);
	assertEquals(GetPrecedence("+", "-"), 0);
	assertEquals(GetPrecedence("*", "+"), -1);
});