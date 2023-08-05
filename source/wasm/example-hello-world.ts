import * as fs from "node:fs";

import { Module, Instruction, Type } from "./index";

let mod = new Module();
const type0 = mod.makeType([Type.Intrinsic.i32], [Type.Intrinsic.i32]);
const type1 = mod.makeType([Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32], [Type.Intrinsic.i32]);

const fd_write = mod.importFunction("wasi_snapshot_preview1", "fd_write", type1);

const mem = mod.addMemory(1);

const main = mod.makeFunction([], []);
main.code.push(Instruction.const.i32(100));
main.code.push(Instruction.const.i32(0));
main.code.push(Instruction.i32.store(0, 2));
main.code.push(Instruction.const.i32(104));
main.code.push(Instruction.const.i32(15));
main.code.push(Instruction.i32.store(0, 2));
main.code.push(Instruction.const.i32(1));
main.code.push(Instruction.const.i32(100));
main.code.push(Instruction.const.i32(1));
main.code.push(Instruction.const.i32(0));
main.code.push(Instruction.call(fd_write));
main.code.push(Instruction.drop());

const extra = mod.makeFunction([Type.Intrinsic.i32], [Type.Intrinsic.i32]);
extra.code.push(Instruction.local.get(0));
extra.code.push(Instruction.return());


mod.exportMemory("memory", mem);
mod.exportFunction("_start", main.ref);

mod.setData(0, "Hello, Warld!\x0a");
mod.setData(100, "\x00\x00\x00\x00\x0e\x00\x00\x00");

fs.writeFileSync("./dump.wasm", mod.toBinary());