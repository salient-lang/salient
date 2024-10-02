import * as colors from "https://deno.land/std@0.201.0/fmt/colors.ts";

import { Compile } from "~/compile.ts";
import { Panic } from "~/compiler/helper.ts";
import { Test } from "~/test.ts";

if (Deno.args.includes("--version")) {
	console.log("version: 0.0.0");
	Deno.exit(0);
}

const verb = Deno.args[0];
switch (verb) {
	case "compile": {
		Compile(Deno.args[1] || "", {
			time: Deno.args.includes("--time")
		});
		break;
	}
	case "test": { Test(); break; }
	default: Panic(
		`${colors.red("Error")}: Unknown verb ${verb}`
	);
}
if (!Deno.args[0]) {
	Panic(`${colors.red("Error")}: Please provide an entry file`);
}
