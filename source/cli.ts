/// <reference lib="deno.ns" />

import { existsSync, writeFileSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { execSync } from "node:child_process";
import chalk from "chalk";

import Project from "./compiler/project.ts";
import Function from "./compiler/function.ts";

if (Deno.args.includes("--version")) {
	console.log("version: 0.0.0");
	Deno.exit(0);
}

if (!Deno.args[0]) {
	console.error(`${chalk.red("Error")}: Please provide an entry file`);
	Deno.exit(1);
}

const cwd = resolve("./");
const root = join(cwd, Deno.args[0]);

if (!existsSync(root)) {
	console.error(`${chalk.red("Error")}: Cannot find entry ${chalk.cyan(relative(cwd, root))}`);
	Deno.exit(1);
}

const project = new Project(root);
if (project.failed) {
	console.error(`Compilation ${chalk.red("Failed")}`);
	Deno.exit(1);
}

const mainFile = project.entry;
const mainFunc = mainFile.namespace["fibonacci"];
if (!(mainFunc instanceof Function)) {
	console.error(`Main namespace is not a function: ${mainFunc.constructor.name}`);
	Deno.exit(1);
}


mainFunc.compile();


writeFileSync("out.wasm", project.module.toBinary());
execSync("wasm2wat out.wasm -o out.wat");
console.log(`  out: ${"out.wasm"}`);