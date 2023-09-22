import { dirname, relative } from "https://deno.land/std@0.201.0/path/mod.ts";

import Module from "../wasm/module.ts";
import { File } from "./file.ts"

export default class Project {
	files: File[];
	cwd: string;

	module: Module;

	failed: boolean;

	constructor(base: string) {
		this.failed = false;
		this.files = [];
		this.cwd = dirname(base);

		this.module = new Module();
	}

	import(filePath: string) {
		const name = relative(this.cwd, filePath);
		const data = Deno.readTextFileSync(filePath);
		const file = new File(this, filePath, name, data);
		this.files.push(file);

		return file;
	}

	importRaw(data: string) {
		const file = new File(this, "./", "[buffer]", data);
		this.files.push(file);

		return file;
	}

	markFailure() {
		this.failed = true;
	}
}