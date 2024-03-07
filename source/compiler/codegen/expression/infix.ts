import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import { IntrinsicValue, bool, u8, i8, u16, i16, u32, i32, u64, i64, f32, f64 } from "~/compiler/intrinsic.ts";
import { OperandType, SolidType, IsSolidType } from "~/compiler/codegen/expression/type.ts";
import { PrecedenceTree } from "~/compiler/codegen/expression/precedence.ts";
import { ReferenceRange } from "~/parser.ts";
import { Instruction } from "~/wasm/index.ts";
import { CompileArg } from "~/compiler/codegen/expression/operand.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Panic } from "~/helper.ts";


export function CompileInfix(ctx: Context, lhs: PrecedenceTree, op: string, rhs: PrecedenceTree, ref: ReferenceRange, expect?: SolidType): OperandType {
	if (op === "as") return CompileAs(ctx, lhs, rhs, ref);

	const a = CompilePrecedence(ctx, lhs, expect);
	if (!(a instanceof IntrinsicValue)) Panic(
		`${colors.red("Error")}: Cannot apply infix operation to non-variable\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: lhs.ref
	});

	const b = CompilePrecedence(ctx, rhs, a.type);
	if (!(b instanceof IntrinsicValue)) Panic(
		`${colors.red("Error")}: Cannot apply infix operation to non-variable\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: rhs.ref
	});

	switch (op) {
		case "+": return CompileAdd(ctx, a, b, ref);
		case "-": return CompileSub(ctx, a, b, ref);
		case "*": return CompileMul(ctx, a, b, ref);
		case "/": return CompileDiv(ctx, a, b, ref);
		case "%": return CompileRem(ctx, a, b, ref);

		case "&&": return CompileAnd(ctx, a, b, ref);
		case "||": return CompileOr (ctx, a, b, ref);
		case "^":  return CompileXor(ctx, a, b, ref);

		case "==": return CompileEq (ctx, a, b, ref);
		case "!=": return CompileNeq(ctx, a, b, ref);
		case "<":  return CompileLt (ctx, a, b, ref);
		case "<=": return CompileLe (ctx, a, b, ref);
		case ">":  return CompileGt (ctx, a, b, ref);
		case ">=": return CompileGe (ctx, a, b, ref);


		default: Panic(`${colors.red("Error")}: Unimplemented infix operation "${op}"\n`, {
			path: ctx.file.path, name: ctx.file.name, ref
		});
	}
}

function CompilePrecedence(ctx: Context, elm: PrecedenceTree, expect?: SolidType): OperandType {
	if (elm.type === "expr_arg") return CompileArg(ctx, elm, expect);
	return CompileInfix(ctx, elm.lhs, elm.op, elm.rhs, elm.ref, expect);
}



function CompileAs(ctx: Context, lhs: PrecedenceTree, rhs: PrecedenceTree, ref: ReferenceRange): OperandType {
	const goal = CompilePrecedence(ctx, rhs);
	if (!IsSolidType(goal)) Panic(
		`${colors.red("Error")}: Cannot type coerce to non-solid type\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: rhs.ref
	});

	const a = CompilePrecedence(ctx, lhs, goal);
	if (a !== goal) Panic(
		`${colors.red("Error")}: Type coerce is currently unimplemented\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: lhs.ref
	});

	return a;
}



function CompileAdd(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot add unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value || lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.add());
		return lhs;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.add());
		return lhs;
	}

	if (lhs === f32.value) {
		ctx.block.push(Instruction.f32.add());
		return lhs;
	}

	if (lhs === f64.value) {
		ctx.block.push(Instruction.f64.add());
		return lhs;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileSub(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot subtract unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value || lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.sub());
		return lhs;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.sub());
		return lhs;
	}

	if (lhs === f32.value) {
		ctx.block.push(Instruction.f32.sub());
		return lhs;
	}

	if (lhs === f64.value) {
		ctx.block.push(Instruction.f64.sub());
		return lhs;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}




function CompileMul(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot multiply unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value || lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.mul());
		return lhs;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.mul());
		return lhs;
	}

	if (lhs === f32.value) {
		ctx.block.push(Instruction.f32.mul());
		return lhs;
	}

	if (lhs === f64.value) {
		ctx.block.push(Instruction.f64.mul());
		return lhs;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileDiv(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot divide unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value) {
		ctx.block.push(Instruction.i32.div_s());
		return lhs;
	}

	if (lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.div_u());
		return lhs;
	}

	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.div_s());
		return lhs;
	}
	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.div_u());
		return lhs;
	}

	if (lhs === f32.value) {
		ctx.block.push(Instruction.f32.div());
		return lhs;
	}
	if (lhs === f64.value) {
		ctx.block.push(Instruction.f64.div());
		return lhs;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileRem(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot remainder unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value) {
		ctx.block.push(Instruction.i32.rem_s());
		return lhs;
	}

	if (lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.rem_u());
		return lhs;
	}

	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.rem_s());
		return lhs;
	}
	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.rem_u());
		return lhs;
	}

	if (lhs === f32.value) {
		const regA = ctx.scope.register.allocate(f32.bitcode, false);
		const regB = ctx.scope.register.allocate(f32.bitcode, false);
		ctx.block.push(Instruction.local.set(regB.ref));
		ctx.block.push(Instruction.local.set(regA.ref));

		ctx.block.push(Instruction.local.get(regA.ref)); // a -

		ctx.block.push(Instruction.local.get(regA.ref)); // floor(a/b)
		ctx.block.push(Instruction.local.get(regB.ref));
		ctx.block.push(Instruction.f32.div());
		ctx.block.push(Instruction.f32.trunc());

		ctx.block.push(Instruction.local.get(regB.ref)); // * b
		ctx.block.push(Instruction.f32.mul());

		ctx.block.push(Instruction.f32.sub());

		regA.free();
		regB.free();
		return lhs;
	}

	if (lhs === f64.value) {
		const regA = ctx.scope.register.allocate(f64.bitcode, false);
		const regB = ctx.scope.register.allocate(f64.bitcode, false);
		ctx.block.push(Instruction.local.set(regA.ref));
		ctx.block.push(Instruction.local.set(regB.ref));

		ctx.block.push(Instruction.local.get(regA.ref));
		ctx.block.push(Instruction.local.get(regB.ref));
		ctx.block.push(Instruction.f64.div());
		ctx.block.push(Instruction.f64.trunc());

		ctx.block.push(Instruction.local.get(regB.ref));
		ctx.block.push(Instruction.f64.mul());

		ctx.block.push(Instruction.local.get(regA.ref));
		ctx.block.push(Instruction.f64.sub());

		regA.free();
		regB.free();
		return lhs;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}





function CompileAnd(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot && unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value) {
		ctx.block.push(Instruction.i32.and());
		return lhs;
	}
	if (lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.and());
		return lhs;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.and());
		return lhs;
	}
	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.and());
		return lhs;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileOr(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot || unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value) {
		ctx.block.push(Instruction.i32.or());
		return lhs;
	}

	if (lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.or());
		return lhs;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.or());
		return lhs;
	}
	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.or());
		return lhs;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileXor(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot ^ unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value) {
		ctx.block.push(Instruction.i32.xor());
		return lhs;
	}

	if (lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.xor());
		return lhs;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.xor());
		return lhs;
	}
	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.xor());
		return lhs;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}





function CompileEq(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot == unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value) {
		ctx.block.push(Instruction.i32.eq());
		return bool.value;
	}

	if (lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.eq());
		return bool.value;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.eq());
		return bool.value;
	}
	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.eq());
		return bool.value;
	}

	if (lhs === f32.value) {
		ctx.block.push(Instruction.f32.eq());
		return bool.value;
	}
	if (lhs === f64.value) {
		ctx.block.push(Instruction.f64.eq());
		return bool.value;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileNeq(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot != unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value) {
		ctx.block.push(Instruction.i32.ne());
		return bool.value;
	}

	if (lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.ne());
		return bool.value;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.ne());
		return bool.value;
	}
	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.ne());
		return bool.value;
	}

	if (lhs === f32.value) {
		ctx.block.push(Instruction.f32.ne());
		return bool.value;
	}
	if (lhs === f64.value) {
		ctx.block.push(Instruction.f64.ne());
		return bool.value;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileLt(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot < unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value) {
		ctx.block.push(Instruction.i32.lt_s());
		return bool.value;
	}

	if (lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.lt_u());
		return bool.value;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.lt_s());
		return bool.value;
	}
	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.lt_u());
		return bool.value;
	}

	if (lhs === f32.value) {
		ctx.block.push(Instruction.f32.lt());
		return bool.value;
	}
	if (lhs === f64.value) {
		ctx.block.push(Instruction.f64.lt());
		return bool.value;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileLe(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot <= unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value) {
		ctx.block.push(Instruction.i32.le_s());
		return bool.value;
	}

	if (lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.le_u());
		return bool.value;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.le_s());
		return bool.value;
	}
	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.le_u());
		return bool.value;
	}

	if (lhs === f32.value) {
		ctx.block.push(Instruction.f32.le());
		return bool.value;
	}
	if (lhs === f64.value) {
		ctx.block.push(Instruction.f64.le());
		return bool.value;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileGt(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot > unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value) {
		ctx.block.push(Instruction.i32.gt_s());
		return bool.value;
	}

	if (lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.gt_u());
		return bool.value;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.gt_s());
		return bool.value;
	}
	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.gt_u());
		return bool.value;
	}

	if (lhs === f32.value) {
		ctx.block.push(Instruction.f32.gt());
		return bool.value;
	}
	if (lhs === f64.value) {
		ctx.block.push(Instruction.f64.gt());
		return bool.value;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileGe(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) Panic(`${colors.red("Error")}: Cannot >= unmatched types ${lhs.type.name} != ${rhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8.value || lhs === i16.value || lhs === i32.value) {
		ctx.block.push(Instruction.i32.ge_s());
		return bool.value;
	}

	if (lhs === u8.value || lhs === u16.value || lhs === u32.value) {
		ctx.block.push(Instruction.i32.ge_u());
		return bool.value;
	}

	if (lhs === i64.value || lhs === u64.value) {
		ctx.block.push(Instruction.i64.ge_s());
		return bool.value;
	}
	if (lhs === i64.value) {
		ctx.block.push(Instruction.i64.ge_u());
		return bool.value;
	}

	if (lhs === f32.value) {
		ctx.block.push(Instruction.f32.ge());
		return bool.value;
	}
	if (lhs === f64.value) {
		ctx.block.push(Instruction.f64.ge());
		return bool.value;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}
