#!/usr/bin/env node
"use strict";

import { readFileSync, existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import chalk from "chalk";

import { Parse } from "./parser.js";


const cwd = resolve("./");
const root = join(cwd, process.argv[2]);

if (!existsSync(root)) {
	console.error(`${chalk.red("Error")}: Cannot find entry ${chalk.cyan(relative(cwd, root))}`);
	process.exit(1);
}

const data = readFileSync(root, 'utf8');
Parse(data, root, relative(cwd, root));