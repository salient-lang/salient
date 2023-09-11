import { dirname, relative } from "https://deno.land/std@0.201.0/path/mod.ts";

import Module from "../wasm/module.ts";
import { File } from "./file.ts"

export default class Project {
	files: File[];
	entry: File;
	cwd: string;

	module: Module;

	failed: boolean;

	constructor(entry: string) {
		this.failed = false;
		this.files = [];
		this.cwd = dirname(entry);

		this.module = new Module();
		this.entry = this.import(entry);
	}

	import(filePath: string) {
		const file = new File(this, filePath, relative(this.cwd, filePath));
		this.files.push(file);

		return file;
	}

	markFailure() {
		this.failed = true;
	}
}