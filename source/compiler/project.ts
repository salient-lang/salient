import Package from "~/compiler/package.ts";
import Module from "~/wasm/module.ts";
import { BasePointer, BasePointerType } from "~/compiler/codegen/expression/type.ts";
import { GlobalRegister } from "~/wasm/section/global.ts";
import { Instruction } from "~/wasm/index.ts";
import { Intrinsic } from "~/wasm/type.ts";

type ProjectFlags = {
	tailCall: boolean;
}

export default class Project {
	module: Module;
	packages: Package[];

	stackReg: GlobalRegister;
	stackBase: BasePointer;

	flags: ProjectFlags;

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
		this.stackBase = new BasePointer(BasePointerType.global, this.stackReg.ref);

		const memRef = this.module.addMemory(1, 1);
		this.module.exportMemory("memory", memRef);

		this.flags = {
			tailCall: true
		};
	}

	markFailure() {
		this.failed = true;
	}
}