import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import { Intrinsic, f32, f64, i16, i32, i64, i8, u16, u32, u64, u8 } from "../../intrinsic.ts";
import { ReferenceRange } from "../../../parser.ts";
import { Instruction } from "../../../wasm/index.ts";
import { Context } from "./../context.ts";
import { Yeet } from "../../../helper.ts";


export function CompileInfix(ctx: Context, lhs: Intrinsic, op: string, rhs: Intrinsic, ref: ReferenceRange) {
	switch (op) {
		case "+": return CompileAdd(ctx, lhs, rhs, ref);
		case "-": return CompileSub(ctx, lhs, rhs, ref);
		case "*": return CompileMul(ctx, lhs, rhs, ref);
		case "/": return CompileDiv(ctx, lhs, rhs, ref);
		case "%": return CompileRem(ctx, lhs, rhs, ref);

		case "&&": return CompileAnd(ctx, lhs, rhs, ref);
		case "||": return CompileOr (ctx, lhs, rhs, ref);
		case "^":  return CompileXor(ctx, lhs, rhs, ref);

		case "==": return CompileEq(ctx, lhs, rhs, ref);
		case "!=": return CompileNeq(ctx, lhs, rhs, ref);
		case "<":  return CompileLt(ctx, lhs, rhs, ref);
		case "<=": return CompileLe(ctx, lhs, rhs, ref);
		case ">":  return CompileGt(ctx, lhs, rhs, ref);
		case ">=": return CompileGe(ctx, lhs, rhs, ref);


		default: Yeet(`${colors.red("Error")}: Unimplemented infix operation "${op}"\n`, {
			path: ctx.file.path, name: ctx.file.name, ref
		});
	}
}



function CompileAdd(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot add unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32 || lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.add());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.add());
		return lhs;
	}

	if (lhs === f32) {
		ctx.block.push(Instruction.f32.add());
		return lhs;
	}

	if (lhs === f64) {
		ctx.block.push(Instruction.f64.add());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileSub(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot subtract unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32 || lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.sub());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.sub());
		return lhs;
	}

	if (lhs === f32) {
		ctx.block.push(Instruction.f32.sub());
		return lhs;
	}

	if (lhs === f64) {
		ctx.block.push(Instruction.f64.sub());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}




function CompileMul(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot multiply unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32 || lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.mul());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.mul());
		return lhs;
	}

	if (lhs === f32) {
		ctx.block.push(Instruction.f32.mul());
		return lhs;
	}

	if (lhs === f64) {
		ctx.block.push(Instruction.f64.mul());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileDiv(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot divide unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32) {
		ctx.block.push(Instruction.i32.div_s());
		return lhs;
	}

	if (lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.div_u());
		return lhs;
	}

	if (lhs === i64) {
		ctx.block.push(Instruction.i64.div_s());
		return lhs;
	}
	if (lhs === i64) {
		ctx.block.push(Instruction.i64.div_u());
		return lhs;
	}

	if (lhs === f32) {
		ctx.block.push(Instruction.f32.div());
		return lhs;
	}
	if (lhs === f64) {
		ctx.block.push(Instruction.f64.div());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileRem(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot remainder unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32) {
		ctx.block.push(Instruction.i32.rem_s());
		return lhs;
	}

	if (lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.rem_u());
		return lhs;
	}

	if (lhs === i64) {
		ctx.block.push(Instruction.i64.rem_s());
		return lhs;
	}
	if (lhs === i64) {
		ctx.block.push(Instruction.i64.rem_u());
		return lhs;
	}

	if (lhs === f32) {
		const regA = ctx.scope.register.allocate(f32.bitcode, false);
		const regB = ctx.scope.register.allocate(f32.bitcode, false);
		ctx.block.push(Instruction.local.set(regA.ref));
		ctx.block.push(Instruction.local.set(regB.ref));

		ctx.block.push(Instruction.local.get(regA.ref));
		ctx.block.push(Instruction.local.get(regB.ref));
		ctx.block.push(Instruction.f32.div());
		ctx.block.push(Instruction.f32.trunc());

		ctx.block.push(Instruction.local.get(regB.ref));
		ctx.block.push(Instruction.f32.mul());

		ctx.block.push(Instruction.local.get(regA.ref));
		ctx.block.push(Instruction.f32.sub());

		regA.free();
		regB.free();
		return lhs;
	}

	if (lhs === f64) {
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

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}





function CompileAnd(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot divide unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32) {
		ctx.block.push(Instruction.i32.and());
		return lhs;
	}
	if (lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.and());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.and());
		return lhs;
	}
	if (lhs === i64) {
		ctx.block.push(Instruction.i64.and());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileOr(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot divide unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32) {
		ctx.block.push(Instruction.i32.or());
		return lhs;
	}

	if (lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.or());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.or());
		return lhs;
	}
	if (lhs === i64) {
		ctx.block.push(Instruction.i64.or());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileXor(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot divide unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32) {
		ctx.block.push(Instruction.i32.xor());
		return lhs;
	}

	if (lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.xor());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.xor());
		return lhs;
	}
	if (lhs === i64) {
		ctx.block.push(Instruction.i64.xor());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}





function CompileEq(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot divide unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32) {
		ctx.block.push(Instruction.i32.eq());
		return lhs;
	}

	if (lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.eq());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.eq());
		return lhs;
	}
	if (lhs === i64) {
		ctx.block.push(Instruction.i64.eq());
		return lhs;
	}

	if (lhs === f32) {
		ctx.block.push(Instruction.f32.eq());
		return lhs;
	}
	if (lhs === f64) {
		ctx.block.push(Instruction.f64.eq());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileNeq(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot divide unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32) {
		ctx.block.push(Instruction.i32.ne());
		return lhs;
	}

	if (lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.ne());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.ne());
		return lhs;
	}
	if (lhs === i64) {
		ctx.block.push(Instruction.i64.ne());
		return lhs;
	}

	if (lhs === f32) {
		ctx.block.push(Instruction.f32.ne());
		return lhs;
	}
	if (lhs === f64) {
		ctx.block.push(Instruction.f64.ne());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileLt(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot divide unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32) {
		ctx.block.push(Instruction.i32.lt_s());
		return lhs;
	}

	if (lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.lt_u());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.lt_s());
		return lhs;
	}
	if (lhs === i64) {
		ctx.block.push(Instruction.i64.lt_u());
		return lhs;
	}

	if (lhs === f32) {
		ctx.block.push(Instruction.f32.lt());
		return lhs;
	}
	if (lhs === f64) {
		ctx.block.push(Instruction.f64.lt());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileLe(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot divide unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32) {
		ctx.block.push(Instruction.i32.le_s());
		return lhs;
	}

	if (lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.le_u());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.le_s());
		return lhs;
	}
	if (lhs === i64) {
		ctx.block.push(Instruction.i64.le_u());
		return lhs;
	}

	if (lhs === f32) {
		ctx.block.push(Instruction.f32.le());
		return lhs;
	}
	if (lhs === f64) {
		ctx.block.push(Instruction.f64.le());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileGt(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot divide unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32) {
		ctx.block.push(Instruction.i32.gt_s());
		return lhs;
	}

	if (lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.gt_u());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.gt_s());
		return lhs;
	}
	if (lhs === i64) {
		ctx.block.push(Instruction.i64.gt_u());
		return lhs;
	}

	if (lhs === f32) {
		ctx.block.push(Instruction.f32.gt());
		return lhs;
	}
	if (lhs === f64) {
		ctx.block.push(Instruction.f64.gt());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}

function CompileGe(ctx: Context, lhs: Intrinsic, rhs: Intrinsic, ref: ReferenceRange) {
	if (lhs !== rhs) Yeet(`${colors.red("Error")}: Cannot divide unmatched types ${lhs.name} != ${rhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});

	if (lhs === i8 || lhs === i16 || lhs === i32) {
		ctx.block.push(Instruction.i32.ge_s());
		return lhs;
	}

	if (lhs === u8 || lhs === u16 || lhs === u32) {
		ctx.block.push(Instruction.i32.ge_u());
		return lhs;
	}

	if (lhs === i64 || lhs === u64) {
		ctx.block.push(Instruction.i64.ge_s());
		return lhs;
	}
	if (lhs === i64) {
		ctx.block.push(Instruction.i64.ge_u());
		return lhs;
	}

	if (lhs === f32) {
		ctx.block.push(Instruction.f32.ge());
		return lhs;
	}
	if (lhs === f64) {
		ctx.block.push(Instruction.f64.ge());
		return lhs;
	}

	Yeet(`${colors.red("Error")}: Unhandled type ${lhs.name}\n`, {
		path: ctx.file.path, name: ctx.file.name, ref
	});
}
