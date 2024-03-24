import type { Term_Expr, Term_Expr_arg, _Literal } from "~/bnf/syntax.d.ts";
import { ReferenceRange } from "~/parser.ts";
import { Panic } from "~/compiler/helper.ts";


const precedence = {
	".": 1, "->": 1,
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

export function GetPrecedence (a: string, b: string) {
	const A = precedence[a];
	const B = precedence[b];
	if (!A) Panic(`Unknown infix operation ${a}`);
	if (!B) Panic(`Unknown infix operation ${a}`);

	return A !== B
		? Math.min(1, Math.max(-1, A-B))
		: 0;
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
		const op  = action.value[0].value;
		const arg = action.value[1]

		// First action
		if (root.type !== "infix") {
			root = {
				type: "infix",
				lhs: root,
				op,
				rhs: arg,
				ref: ReferenceRange.union(root.ref, arg.ref)
			};
			continue;
		}

		const p = GetPrecedence(root.op, op);
		if (p > 0) {
			// Transform stealing previous operand
			// (1 + 2) * 3 -> (2 * 3) + 1
			root = {
				type: "infix",
				lhs: {
					type: "infix",
					lhs: root.rhs,
					op,
					rhs: arg,
					ref: ReferenceRange.union(root.ref, arg.ref)
				},
				op: root.op,
				rhs: root.lhs,
				ref: ReferenceRange.union(arg.ref, arg.ref)
			}
		} else {
			root = {
				type: "infix",
				lhs: root,
				op:  op,
				rhs: arg,
				ref: ReferenceRange.union(root.ref, arg.ref)
			}
		}
	}

	return root;
}