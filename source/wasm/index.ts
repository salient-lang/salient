import * as fs from "node:fs";

import Module from "./module";
import * as Type from "./type";


export {
	Module,
	Type
};


let mod = new Module();
fs.writeFileSync("./dump.wasm", mod.toBinary());
