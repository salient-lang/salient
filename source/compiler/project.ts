import path from "node:path";

import { File } from "./file.ts"
import Module from "../wasm/module.ts";

export default class Project {
	files: File[];
	entry: File;
	cwd: string;

	module: Module;

	failed: boolean;

	constructor(entry: string) {
		this.failed = false;
		this.files = [];
		this.cwd = path.dirname(entry);

		this.module = new Module();
		this.entry = this.import(entry);
	}

	import(filePath: string) {
		const file = new File(this, filePath, path.relative(this.cwd, filePath));
		this.files.push(file);

		return file;
	}

	markFailure() {
		this.failed = true;
	}
}