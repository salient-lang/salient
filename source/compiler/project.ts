import path from "node:path";

import File from "./file.js"

export default class Project {
	files: File[];
	cwd: string;

	failed: boolean;

	constructor(entry: string) {
		this.failed = false;
		this.files = [];

		this.cwd = path.dirname(entry);
	}

	import(filePath: string) {
		this.files.push(
			new File(this, filePath, path.relative(this.cwd, filePath))
		);
	}
}