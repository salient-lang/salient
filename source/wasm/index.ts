import * as fs from "node:fs";

import Module from "./module";


export {
	Module
};


let mod = new Module();
fs.writeFileSync("./dump.wasm", mod.toBinary());
