import type { Term_Expr, Term_Expr_arg, _Literal } from "~/bnf/syntax.d.ts";
import { ReferenceRange } from "~/parser.ts";
import { Panic } from "~/compiler/helper.ts";


const precedence = {
	".": 1, "->": 1,
	"**": 2,
	"*" : 3, "/" : 3, "%" : 3,
	"+" : 4, "-" : 4,
	"<<": 5, ">>": 5,
	"<" : 6, ">" : 6, "<=": 6, ">=": 6,
	"instanceof": 7,
	"==": 8, "!=": 8,
	"as": 9,
	"&": 10,
	"^": 11,
	"|": 12,
	"&&": 13,
	"||": 14,
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

	const val_stack = new Array<PrecedenceTree>();
	const op_stack  = new Array<string>();

	val_stack.push(syntax.value[0]);

	for (const action of syntax.value[1].value) {
		const op  = action.value[0].value;
		const arg = action.value[1];

		const prev = op_stack.pop();
		if (prev === undefined || GetPrecedence(prev, op) < 0) {
			if (prev) op_stack.push(prev);
			val_stack.push(arg);
			op_stack.push(op);
		} else {
			const lhs = val_stack.pop()!;

			val_stack.push({
				type: "infix",
				lhs: lhs,
				op:  op,
				rhs: arg,
				ref: ReferenceRange.union(lhs.ref, arg.ref)
			});
			op_stack.push(prev);
		}
	}

	let root = val_stack[0]!;
	for (let i=1; i<val_stack.length; i++) {
		const nx = val_stack[i]!;
		root = {
			type: "infix",
			lhs: root,
			op:  op_stack[i-1]!,
			rhs: nx,
			ref: ReferenceRange.union(root.ref, nx.ref),
		}
		console.log(root.op);
	}

	console.log(val_stack);

	[9.5, 0.5, 8.0, 1.0];
	["-", "-", "="]

	// while (op_stack.length > 0) {
	// 	const op = op_stack.pop()!;
	// 	const rhs = val_stack.pop()!;
	// 	const lhs = val_stack.pop()!;

	// 	val_stack.push({
	// 		type: "infix",
	// 		lhs,
	// 		op,
	// 		rhs,
	// 		ref: ReferenceRange.union(lhs.ref, rhs.ref),
	// 	});
	// }

	// if (val_stack.length !== 1) throw new Error("Operand stack unexpectedly didn't fully drain");

	return root;
}