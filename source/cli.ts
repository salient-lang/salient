/// <reference lib="deno.ns" />

import { resolve, join, relative } from "https://deno.land/std@0.201.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.201.0/fs/mod.ts";
import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import Project from "./compiler/project.ts";
import Function from "./compiler/function.ts";
import { Yeet } from "./helper.ts";

if (Deno.args.includes("--version")) {
	console.log("version: 0.0.0");
	Deno.exit(0);
}

if (!Deno.args[0]) {
	Yeet(`${colors.red("Error")}: Please provide an entry file`);
}

const cwd = resolve("./");
const root = join(cwd, Deno.args[0]);

if (!existsSync(root)) {
	Yeet(`${colors.red("Error")}: Cannot find entry ${colors.cyan(relative(cwd, root))}`);
}

const project = new Project(root);
if (project.failed) {
	Yeet(`Compilation ${colors.red("Failed")}`);
}

const mainFile = project.entry;
const mainFunc = mainFile.namespace["main"];
if (!(mainFunc instanceof Function)) {
	Yeet(`Main namespace is not a function: ${mainFunc.constructor.name}`);
}


mainFunc.compile();


await Deno.writeFile("out.wasm", project.module.toBinary());
console.log(`  out: ${"out.wasm"}`);

const command = new Deno.Command(
	"wasm2wat",
	{
		args: ["-v", "out.wasm", "-o", "out.wat"]
	}
);
const { code, stdout, stderr } = await command.output();
if (code !== 0) {
	console.error("Invalid wasm generated");
	console.error(new TextDecoder().decode(stderr));
	Deno.exit(1);
}
