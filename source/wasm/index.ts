import * as fs from "node:fs";

import Module from "./module";
import * as Type from "./type";
import { Function } from "./function";


export {
	Module,
	Type
};


let mod = new Module();
const type0 = mod.makeType([Type.Intrinsic.i32], [Type.Intrinsic.i32]);
const type1 = mod.makeType([Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32], [Type.Intrinsic.i32]);

mod.importFunction("wasix_32v1", "tty_get", type0);
mod.importFunction("wasi_snapshot_preview1", "fd_write", type1);

const mem = mod.addMemory(1);

const main  = mod.makeFunction([], []);
const extra = mod.makeFunction([Type.Intrinsic.i32], [Type.Intrinsic.i32]);

mod.exportMemory("memory", mem);
mod.exportFunction("_start", main.ref);

mod.setData(0, "Hello, Warld!\x0a");
mod.setData(100, "\x00\x00\x00\x00\x0e\x00\x00\x00");

fs.writeFileSync("./dump.wasm", mod.toBinary());
