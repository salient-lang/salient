#!/usr/bin/env node
"use strict";

import { existsSync, writeFileSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { execSync } from "node:child_process";
import chalk from "chalk";

import Project from "./compiler/project.ts";
import Function from "./compiler/function.ts";

if (process.argv.includes("--version")) {
	console.log("version: 0.0.0");
	process.exit(0);
}

const cwd = resolve("./");
const root = join(cwd, process.argv[2]);

if (!existsSync(root)) {
	console.error(`${chalk.red("Error")}: Cannot find entry ${chalk.cyan(relative(cwd, root))}`);
	process.exit(1);
}

const project = new Project(root);
if (project.failed) {
	console.error(`Compilation ${chalk.red("Failed")}`);
	process.exit(1);
}

const mainFile = project.entry;
const mainFunc = mainFile.namespace["fibonacci"];
if (!(mainFunc instanceof Function)) {
	console.error(`Main namespace is not a function: ${mainFunc.constructor.name}`);
	process.exit(1);
}


mainFunc.compile();


writeFileSync("out.wasm", project.module.toBinary());
execSync("wasm2wat out.wasm -o out.wat");
console.log(`  out: ${"out.wasm"}`);