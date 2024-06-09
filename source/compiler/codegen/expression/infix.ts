import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import * as WasmTypes from "~/wasm/type.ts";
import Structure from "~/compiler/structure.ts";
import { IntrinsicValue, bool, u8, i8, u16, i16, u32, i32, u64, i64, f32, f64, IntrinsicType } from "~/compiler/intrinsic.ts";
import { OperandType, SolidType, IsSolidType, LinearType } from "~/compiler/codegen/expression/type.ts";
import { InlineClamp, ResolveLinearType } from "~/compiler/codegen/expression/helper.ts";
import { PrecedenceTree } from "~/compiler/codegen/expression/precedence.ts";
import { ReferenceRange } from "~/parser.ts";
import { Instruction } from "~/wasm/index.ts";
import { CompileArg } from "~/compiler/codegen/expression/operand.ts";
import { Context } from "~/compiler/codegen/context.ts";
import { Panic } from "~/compiler/helper.ts";


export function CompileInfix(ctx: Context, lhs: PrecedenceTree, op: string, rhs: PrecedenceTree, ref: ReferenceRange, expect?: SolidType, tailCall = false): OperandType {
	if (op === "as") return CompileAs(ctx, lhs, rhs, ref);
	if (op === ".")  return CompileStaticAccess(ctx, lhs, rhs, expect);

	let a = CompilePrecedence(ctx, lhs, expect);
	if (a instanceof LinearType && a.type instanceof IntrinsicValue) a = ResolveLinearType(ctx, a, rhs.ref);

	if (!(a instanceof IntrinsicValue)) Panic(
		`${colors.red("Error")}: Cannot apply arithmetic infix operation to non-intrinsics ${colors.cyan(a.getTypeName())}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: lhs.ref
	});

	let b = CompilePrecedence(ctx, rhs, a.type, tailCall);
	if (b instanceof LinearType && b.type instanceof IntrinsicValue) b = ResolveLinearType(ctx, b, rhs.ref);
	if (!(b instanceof IntrinsicValue)) Panic(
		`${colors.red("Error")}: Cannot apply arithmetic infix operation to non-intrinsics ${colors.cyan(b.getTypeName())}\n`, {
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

function CompilePrecedence(ctx: Context, elm: PrecedenceTree, expect?: SolidType, tailCall = false): OperandType {
	if (elm.type === "expr_arg") return CompileArg(ctx, elm, expect, tailCall);
	return CompileInfix(ctx, elm.lhs, elm.op, elm.rhs, elm.ref, expect);
}



function CompileAs(ctx: Context, lhs: PrecedenceTree, rhs: PrecedenceTree, ref: ReferenceRange): OperandType {
	const goal = CompilePrecedence(ctx, rhs);
	if (!IsSolidType(goal)) Panic(
		`${colors.red("Error")}: Cannot type coerce to non-solid type\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: rhs.ref
	});

	if (!(goal instanceof IntrinsicType)) Panic(
		`${colors.red("Error")}: Cannot type coerce to non-intrinsic type\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: rhs.ref
	});

	const a = CompilePrecedence(ctx, lhs, goal);

	if (!(a instanceof IntrinsicValue) && !(a instanceof LinearType)) Panic(
		`${colors.red("Error")}: Type coerce is currently unimplemented (${a.getTypeName()})\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: lhs.ref
	});

	const value = a instanceof LinearType
		? ResolveLinearType(ctx, a, ref)
		: a;

	if (value instanceof LinearType) Panic(
		`${colors.red("Error")}: Type coerce is currently unimplemented (${a.getTypeName()})\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: lhs.ref
	});

	if (goal === f32 || goal === f64) {
		CoerceToFloat(ctx, value.type, goal);
	} else {
		CoerceToInt(ctx, value.type, goal);
	}

	return goal.value;
}

function CoerceToFloat(ctx: Context, type: IntrinsicType, goal: IntrinsicType) {
	if (type === f32) {
		if (goal == f32) { /* no-op */ }
		else if (goal === f64) ctx.block.push(Instruction.f64.promote_f32());
		else throw "Logic failure";

		return goal;
	}

	if (type === f64) {
		if (goal == f64) { /* no-op */ }
		else if (goal === f32) ctx.block.push(Instruction.f32.demote_f64());
		else throw "Logic failure";

		return goal;
	}

	if (type.bitcode === WasmTypes.Intrinsic.i32) {
		if (type.signed) ctx.block.push(Instruction.i32.trunc_f32_s());
		else ctx.block.push(Instruction.i32.trunc_f32_u());
	} else {
		if (type.signed) ctx.block.push(Instruction.i32.trunc_f64_s());
		else ctx.block.push(Instruction.i32.trunc_f64_u());
	}

	return goal;
}

function CoerceToInt(ctx: Context, type: IntrinsicType, goal: IntrinsicType) {
	// Encoding conversions
	if (type === f32) {
		if (goal.bitcode === WasmTypes.Intrinsic.i32) {
			if (goal.signed) {
				ctx.block.push(Instruction.f32.convert_i32_s());
				type = i32;
			} else {
				ctx.block.push(Instruction.f32.convert_i32_u());
				type = u32;
			}
		} else {
			if (goal.signed) {
				ctx.block.push(Instruction.f32.convert_i64_s());
				type = i64;
			} else {
				ctx.block.push(Instruction.f32.convert_i64_u());
				type = u64;
			}
		}
	} else if (type === f64) {
		if (goal.bitcode === WasmTypes.Intrinsic.i32) {
			if (goal.signed) {
				ctx.block.push(Instruction.f64.convert_i32_s());
				goal = i32;
			} else {
				ctx.block.push(Instruction.f64.convert_i32_u());
				type = u32;
			}
		} else {
			if (goal.signed) {
				ctx.block.push(Instruction.f64.convert_i64_s());
				type = i64;
			}
			else {
				ctx.block.push(Instruction.f64.convert_i64_u());
				type = u64;
			}
		}
	}


	// Bound the value to the correct size for the target
	if (goal.tciBitDepth() < type.tciBitDepth()) {
		const max = Math.pow(2, goal.tciBitDepth()) + ( (goal.signed && type.signed) ? -1 : 0 );
		const min = (goal.signed && type.signed)
			? -Math.pow(2, goal.tciBitDepth())
			: 0;
		InlineClamp(ctx, type, min, max);
	}

	if (type.bitcode != goal.bitcode) {
		if (goal.bitcode == WasmTypes.Intrinsic.i32) {
			if (type.signed) ctx.block.push(Instruction.i32.warp_i64());
			else ctx.block.push(Instruction.i32.warp_i64());
		}
		else {
			if (type.signed) ctx.block.push(Instruction.i64.extend_i32_s());
			else ctx.block.push(Instruction.i64.extend_i32_s());
		}
	}


	return goal;
}


function CompileStaticAccess(ctx: Context, lhs: PrecedenceTree, rhs: PrecedenceTree, expect?: SolidType): OperandType {
	const a = CompilePrecedence(ctx, lhs, expect);
	if (!(a instanceof LinearType)) Panic(
		`${colors.red("Error")}: Cannot static access into a non-struct value\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: lhs.ref
	});
	if (!(a.type instanceof Structure)) Panic(
		`${colors.red("Error")}: Cannot static access off an intrinsic value\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: lhs.ref
	});

	if (rhs.type !== "expr_arg") Panic(
		`${colors.red("Error")}: Expected an expression argument for a static access\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: rhs.ref
	});

	const prefix = rhs.value[0].value[0];
	if (prefix) Panic(
		`${colors.red("Error")}: Prefix values are not supported here\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: prefix.ref
	});

	const postfix = rhs.value[2].value;
	if (postfix.length > 0) Panic(
		`${colors.red("Error")}: Postfix values are not supported here\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: rhs.value[2].ref
	});

	const inner = rhs.value[1].value[0];
	if (inner.type !== "name") Panic(
		`${colors.red("Error")}: A name must be given for static access, not this\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: rhs.ref
	});

	const name = inner.value[0].value;
	const attr = a.get(name);
	if (!attr) Panic(
		`${colors.red("Error")}: Unknown attribute ${name} on ${a.getTypeName()}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref: rhs.ref
	});

	return attr;
}



function CompileAdd(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot add unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot subtract unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot multiply unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot divide unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot remainder unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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

	if (lhs === f32.value || lhs === f64.value) return CompileFloatRemainder(ctx, lhs, ref);

	Panic(`${colors.red("Error")}: Unhandled type ${lhs.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileFloatRemainder(ctx: Context, type: IntrinsicValue, ref: ReferenceRange) {
	/**
	 * float fmod(float x, float y) {
			if (y == 0.0) return NaN;

			float quotient = x / y;
			float remainder = x - trunc(quotient) * y;

			if (remainder == 0.0 && quotient < 0.0) return -0.0;
			else return remainder;
	}*/

	if (type === f32.value) {
		const x = ctx.scope.register.allocate(f32.bitcode);
		const y = ctx.scope.register.allocate(f32.bitcode);
		ctx.block.push(Instruction.local.set(y.ref));
		ctx.block.push(Instruction.local.set(x.ref));

		const q = ctx.scope.register.allocate(f32.bitcode);
		const r = ctx.scope.register.allocate(f32.bitcode);

		// if (y == 0) return NaN;
		ctx.block.push(Instruction.local.get(y.ref));
		ctx.block.push(Instruction.const.f32(0.0));
		ctx.block.push(Instruction.f32.eq());
		ctx.block.push(Instruction.if(type.type.bitcode, [
			Instruction.const.f32(NaN)
		], [
			Instruction.local.get(x.ref),  // q = x / y
			Instruction.local.get(y.ref),
			Instruction.f32.div(),
			Instruction.local.set(q.ref),

			Instruction.local.get(x.ref), // x - trunc(q)*y
			Instruction.local.get(q.ref),
			Instruction.f32.trunc(),
			Instruction.local.get(y.ref),
			Instruction.f32.mul(),
			Instruction.f32.sub(),
			Instruction.local.set(r.ref),

			Instruction.local.get(r.ref), // remainder == 0.0
			Instruction.const.f32(0.0),
			Instruction.f32.eq(),

			Instruction.local.get(q.ref), // quotient < 0.0
			Instruction.const.f32(0.0),
			Instruction.f32.lt(),

			Instruction.i32.and(),        // &&
			Instruction.if(f32.bitcode, [
				Instruction.const.f32(-0.0)
			], [
				Instruction.local.get(r.ref)
			])
		]));

		x.free(); y.free();
		q.free(); r.free();

		return type;
	}

	if (type === f64.value) {
		const x = ctx.scope.register.allocate(f64.bitcode);
		const y = ctx.scope.register.allocate(f64.bitcode);
		ctx.block.push(Instruction.local.set(y.ref));
		ctx.block.push(Instruction.local.set(x.ref));

		const q = ctx.scope.register.allocate(f64.bitcode);
		const r = ctx.scope.register.allocate(f64.bitcode);

		// if (y == 0) return NaN;
		ctx.block.push(Instruction.local.get(y.ref));
		ctx.block.push(Instruction.const.f64(0.0));
		ctx.block.push(Instruction.f64.eq());
		ctx.block.push(Instruction.if(type.type.bitcode, [
			Instruction.const.f64(NaN)
		], [
			Instruction.local.get(x.ref),  // q = x / y
			Instruction.local.get(y.ref),
			Instruction.f64.div(),
			Instruction.local.set(q.ref),

			Instruction.local.get(x.ref), // x - trunc(q)*y
			Instruction.local.get(q.ref),
			Instruction.f64.trunc(),
			Instruction.local.get(y.ref),
			Instruction.f64.mul(),
			Instruction.f64.sub(),
			Instruction.local.set(r.ref),

			Instruction.local.get(r.ref), // remainder == 0.0
			Instruction.const.f64(0.0),
			Instruction.f64.eq(),

			Instruction.local.get(q.ref), // quotient < 0.0
			Instruction.const.f64(0.0),
			Instruction.f64.lt(),

			Instruction.i32.and(),        // &&
			Instruction.if(f64.bitcode, [
				Instruction.const.f64(-0.0)
			], [
				Instruction.local.get(r.ref)
			])
		]));

		x.free(); y.free();
		q.free(); r.free();

		return type;
	}

	Panic(`${colors.red("Error")}: Unhandled type ${type.type.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}





function CompileAnd(ctx: Context, lhs: IntrinsicValue, rhs: IntrinsicValue, ref: ReferenceRange) {
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot && unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot || unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot ^ unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot == unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot != unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot < unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot <= unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot > unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
	if (lhs !== rhs) ctx.markFailure(
		`${colors.red("Error")}: Cannot >= unmatched types ${lhs.type.name} != ${rhs.type.name}\n`,
		ref
	);

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
