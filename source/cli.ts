/// <reference lib="deno.ns" />

import { resolve, join, relative } from "https://deno.land/std@0.201.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.201.0/fs/mod.ts";
import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import Function from "~/compiler/function.ts";
import Package from "./compiler/package.ts";
import { Panic } from "~/helper.ts";
import Project from "~/compiler/project.ts";

if (Deno.args.includes("--version")) {
	console.log("version: 0.0.0");
	Deno.exit(0);
}

if (!Deno.args[0]) {
	Panic(`${colors.red("Error")}: Please provide an entry file`);
}

const cwd = resolve("./");
const root = join(cwd, Deno.args[0]);

if (!existsSync(root)) {
	Panic(`${colors.red("Error")}: Cannot find entry ${colors.cyan(relative(cwd, root))}`);
}

const project = new Project();
const mainPck = new Package(project, root);
if (project.failed) Panic(`Compilation ${colors.red("Failed")}`);

const mainFile = mainPck.import(root);
const mainFunc = mainFile.namespace["main"];
if (!(mainFunc instanceof Function)) {
	Panic(`Main namespace is not a function: ${mainFunc.constructor.name}`);
}


mainFunc.compile();

if (project.failed) Panic(`Compilation ${colors.red("Failed")}`);

await Deno.writeFile("out.wasm", project.module.toBinary());

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
console.log(new TextDecoder().decode(stdout));

console.log(`  out: ${"out.wasm"}`);
