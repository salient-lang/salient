/// <reference lib="deno.ns" />

import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import { resolve, join } from "https://deno.land/std@0.201.0/path/mod.ts";
import { Panic } from "~/compiler/helper.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";



export async function Test() {
	const cwd = resolve("./");
	// const root = join(cwd, entry);

	let targets = Deno.args.length > 1
		? Deno.args.slice(1)
		: ['.'];

	let files = new Set<string>();
	for (const t of targets) {
		const stats = Deno.statSync(t);
		if (stats.isFile) {
			if (!t.endsWith("test.sa")) Panic(
				`${colors.red("Error")}: Provided file ${colors.cyan(t)} isn't a test.sa file`
			);

			files.add(t);
		} else if (stats.isDirectory) RecursiveAdd(t, files);
	}

	const project = new Project();
	const mainPck = new Package(project, resolve("./"));

	for (const path of files.values()) {
		const file = mainPck.import(path);
	}
}

function RecursiveAdd(folder: string, set: Set<string>) {
	const files = Deno.readDirSync(folder);
	for (const file of files) {
		const path = `${folder}/${file.name}`;
		if (file.isFile && file.name.endsWith("test.sa")) set.add(path);
		else if (file.isDirectory) RecursiveAdd(path, set);
	}
};
