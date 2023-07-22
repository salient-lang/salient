import * as fs from "node:fs";

import Module from "./module";
import * as Type from "./type";


export {
	Module,
	Type
};


let mod = new Module();
const type0 = mod.makeType([Type.Intrinsic.i32], [Type.Intrinsic.i32]);
const type1 = mod.makeType([Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32], [Type.Intrinsic.i32]);
mod.makeType([], []);

mod.importFunction("wasix_32v1", "tty_get", type0);
mod.importFunction("wasi_snapshot_preview1", "fd_write", type1);

fs.writeFileSync("./dump.wasm", mod.toBinary());
