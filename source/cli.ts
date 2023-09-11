/// <reference lib="deno.ns" />

import { resolve, join, relative } from "https://deno.land/std@0.201.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.201.0/fs/mod.ts";
import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import Project from "./compiler/project.ts";
import Function from "./compiler/function.ts";

if (Deno.args.includes("--version")) {
	console.log("version: 0.0.0");
	Deno.exit(0);
}

if (!Deno.args[0]) {
	console.error(`${colors.red("Error")}: Please provide an entry file`);
	Deno.exit(1);
}

const cwd = resolve("./");
const root = join(cwd, Deno.args[0]);

if (!existsSync(root)) {
	console.error(`${colors.red("Error")}: Cannot find entry ${colors.cyan(relative(cwd, root))}`);
	Deno.exit(1);
}

const project = new Project(root);
if (project.failed) {
	console.error(`Compilation ${colors.red("Failed")}`);
	Deno.exit(1);
}

const mainFile = project.entry;
const mainFunc = mainFile.namespace["fibonacci"];
if (!(mainFunc instanceof Function)) {
	console.error(`Main namespace is not a function: ${mainFunc.constructor.name}`);
	Deno.exit(1);
}


mainFunc.compile();


await Deno.writeFile("out.wasm", project.module.toBinary());
const command = new Deno.Command(
	"wasm2wat",
	{
		args: ["out.wasm", "-o", "out.wat"]
	}
);
const { code, stdout, stderr } = await command.output();
console.assert(code === 0);

console.log(`  out: ${"out.wasm"}`);