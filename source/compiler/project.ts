import { GlobalRegister } from "~/wasm/section/global.ts";
import { Instruction } from "~/wasm/index.ts";
import { Intrinsic } from "~/wasm/type.ts";
import Package from "~/compiler/package.ts";
import Module from "~/wasm/module.ts";

export default class Project {
	module: Module;
	packages: Package[];

	stackReg: GlobalRegister;

	failed: boolean;

	constructor() {
		this.module = new Module();
		this.packages = [];
		this.failed = false;

		this.stackReg = this.module.registerGlobal(
			Intrinsic.i32,
			true,
			Instruction.const.i32(0)
		);

		this.module.addMemory(0, 1);
	}

	markFailure() {
		this.failed = true;
	}
}