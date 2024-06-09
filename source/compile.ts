/// <reference lib="deno.ns" />

import { resolve, join, relative, dirname } from "https://deno.land/std@0.201.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.201.0/fs/mod.ts";
import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import Function from "~/compiler/function.ts";
import Package from "~/compiler/package.ts";
import Project from "~/compiler/project.ts";
import { DisplayTimers, TimerStart, TimerEnd } from "~/helper.ts";
import { Panic } from "~/compiler/helper.ts";
import { File } from "~/compiler/file.ts";


export async function Compile(entry: string, config: {
	time: boolean
}) {
	const cwd = resolve("./");
	const root = join(cwd, entry);

	if (!existsSync(root)) Panic(
		`${colors.red("Error")}: Cannot find entry ${colors.cyan(relative(cwd, root))}`
	);

	const project = new Project();
	const mainPck = new Package(project, dirname(root));

	let mainFile: File;
	try {
		mainFile = mainPck.import(root);
	} catch (e) {
		console.error(e);
		Deno.exit(1);
	}

	const mainFunc = mainFile.namespace["main"];
	if (!(mainFunc instanceof Function)) Panic(
		`Main namespace is not a function: ${colors.cyan(mainFunc.constructor.name)}`
	);

	if (config.time) TimerStart("compilation");
	mainFunc.compile();
	if (config.time) TimerEnd("compilation");

	if (project.failed) Panic(`Compilation ${colors.red("Failed")}`);

	if (!mainFunc.ref) Panic(`Main function not compiled correctly`);
	project.module.exportFunction("_start", mainFunc.ref);
	project.module.exportFunction("main", mainFunc.ref);
	project.module.startFunction(mainFunc.ref);

	if (config.time) TimerStart("serialize");
	await Deno.writeFile("out.wasm", project.toBinary());
	if (config.time) TimerEnd("serialize");

	if (config.time) TimerStart("wasm2wat");
	const command = new Deno.Command(
		"wasm2wat",
		{ args: ["-v", "out.wasm", "-o", "out.wat", "--enable-all"] }
	);
	const { code, stdout, stderr } = await command.output();
	if (code !== 0) {
		console.error("Invalid wasm generated");
		console.error(new TextDecoder().decode(stderr));
		Deno.exit(1);
	}
	if (config.time) TimerEnd("wasm2wat");

	console.log(new TextDecoder().decode(stdout));
	console.log(`  out: "out.wasm" + "out.wat"\n`);

	if (config.time) DisplayTimers();
}
