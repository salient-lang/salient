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
const type2 = mod.makeType([], []);

mod.importFunction("wasix_32v1", "tty_get", type0);
mod.importFunction("wasi_snapshot_preview1", "fd_write", type1);

const mem = mod.addMemory(1);

const main = new Function(type2);
mod.bindFunction(main);
const extra = new Function(type0);
mod.bindFunction(extra);

fs.writeFileSync("./dump.wasm", mod.toBinary());
