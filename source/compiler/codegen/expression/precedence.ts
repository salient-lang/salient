import type { Term_Expr, Term_Expr_arg, _Literal } from "~/bnf/syntax.d.ts";
import { ReferenceRange } from "~/parser.ts";
import { Panic } from "~/compiler/helper.ts";
import { assert } from "https://deno.land/std@0.201.0/assert/assert.ts";


const precedence = {
	".": 1, "->": 1,
	"**": 2,
	"%": 3,
	"*" : 4, "/" : 4,
	"+" : 5, "-" : 5,
	"<<": 6, ">>": 6,
	"<" : 7, ">" : 7, "<=": 7, ">=": 7,
	"instanceof": 8,
	"==": 9, "!=": 9,
	"&": 10,
	"^": 11,
	"|": 12,
	"as": 13,
	"&&": 14,
	"||": 15,
} as { [key: string]: number };

export function GetPrecedence (a: string, b: string) {
	const A = precedence[a];
	const B = precedence[b];
	if (A === undefined) Panic(`Unknown infix operation ${a} 0x${a.charCodeAt(0).toString(16)}`);
	if (B === undefined) Panic(`Unknown infix operation ${b} 0x${b.charCodeAt(0).toString(16)}`);

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
	const rpn       = new Array<PrecedenceTree | string>();
	const op_stack  = new Array<string>();

	rpn.push(syntax.value[0]);
	for (const action of syntax.value[1].value) {
		const op = action.value[0].value;
		while (op_stack.length > 0) {
			const prev = op_stack[op_stack.length - 1]!; // peak
			if (GetPrecedence(prev, op) <= 0) {
				rpn.push(op_stack.pop()!);
			} else break;
		}
		op_stack.push(op);
		rpn.push(action.value[1]);
	}

	// Drain remaining operators
	while (op_stack.length > 0) {
		rpn.push(op_stack.pop()!);
	}

	// This could probably be optimised in the future to not use a stack, and just manipulate a raw root node
	const stack = new Array<PrecedenceTree>();
	while (rpn.length > 0) {
		const token = rpn.shift()!;

		if (typeof token != "string") {
			stack.push(token);
			continue;
		}

		const rhs = stack.pop()!;
		const lhs = stack.pop()!;

		stack.push({
			type: "infix",
			lhs: lhs,
			op:  token,
			rhs: rhs,
			ref: ReferenceRange.union(lhs.ref, rhs.ref)
		})
	}

	const root = stack.pop()!;
	assert(typeof root !== "string", "Expression somehow has no arguments during precedence calculation");
	assert(stack.length == 0, "Expression somehow has only operators during precedence calculation");

	return root;
}


// For debugging assistance when hell breaks loose
function StringifyPrecedence(tree: PrecedenceTree | string): string {
	if (typeof tree === "string") return tree;

	if (tree.type === "infix") return `(${StringifyPrecedence(tree.lhs)} ${tree.op} ${StringifyPrecedence(tree.rhs)})`;

	const arg = tree.value[1].value[0];
	if (arg.type == "expr_brackets") return `(...)`;
	if (arg.type != "constant") return `type[${arg.type}]`;

	if (arg.value[0].type == "boolean") return arg.value[0].value[0].value;
	if (arg.value[0].type == "integer") return arg.value[0].value[0].value;
	if (arg.value[0].type == "float") return arg.value[0].value[0].value;
	return "str";
}