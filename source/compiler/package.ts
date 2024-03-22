import { dirname, relative } from "https://deno.land/std@0.201.0/path/mod.ts";

import type Project from "~/compiler/project.ts";
import { File } from "~/compiler/file.ts"

export default class Package {
	project: Project;
	files: File[];
	cwd: string;

	failed: boolean;

	constructor(project: Project, base: string) {
		this.project = project;
		this.failed = false;
		this.files = [];
		this.cwd = dirname(base);
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
		this.project.markFailure();
	}
}