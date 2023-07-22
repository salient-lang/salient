import * as fs from "node:fs";

import Module from "./module";
import * as Type from "./type";


export {
	Module,
	Type
};


let mod = new Module();
mod.makeType([Type.Intrinsic.i32], [Type.Intrinsic.i32]);
mod.makeType([Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32, Type.Intrinsic.i32], [Type.Intrinsic.i32]);
mod.makeType([], []);
fs.writeFileSync("./dump.wasm", mod.toBinary());
