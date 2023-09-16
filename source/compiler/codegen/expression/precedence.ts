/// <reference lib="deno.ns" />
import { assertEquals, assertThrows } from "https://deno.land/std@0.201.0/assert/mod.ts";

import type { Term_Expr, Term_Expr_arg, Term_Expr_infix, _Literal } from "../../../bnf/syntax.d.ts";


const precedence = {
	"." : 1, "[]": 1, "->": 1,
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
	lhs : PrecedenceTree,
	op  : string,
	rhs : PrecedenceTree
};

export function ApplyPrecedence(syntax: Term_Expr) {
	let root = syntax.value[0] as PrecedenceTree;

	for (const action of syntax.value[1].value) {
		const op = action.value[0].value;
		const arg       = action.value[1]

		// First action
		if (!Array.isArray(root)) {
			root = {
				lhs: root,
				op,
				rhs: arg
			};
			continue;
		}

		const p = GetPrecedence(root[1], op);
		if (p > 0) {
			// Transform stealing previous operand
			// (1 + 2) * 3 -> (2 * 3) + 1
			root = {
				lhs: {
					lhs: root[2],
					op,
					rhs: arg
				},
				op: root[1],
				rhs: root[0],
			}

		} else {
			root = {
				lhs: root[0],
				op:  root[1],
				rhs: {
					lhs: root[2],
					op,
					rhs: arg
				}
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