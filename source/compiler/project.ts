import Module from "~/wasm/module.ts";
import Package from "~/compiler/package.ts";

export default class Project {
	module: Module;
	packages: Package[];

	failed: boolean;

	constructor() {
		this.module = new Module();
		this.packages = [];
		this.failed = false;

		this.module.addMemory(0, 1);
	}

	markFailure() {
		this.failed = true;
	}
}