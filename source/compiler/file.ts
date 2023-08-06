import fs from "node:fs";

import type { Term_Program } from "../bnf/syntax.js";
import type Project from "./project.js";
import { Parse } from "../parser.js";

import Function from "./function.js";
import Global from "./global.js";
import Import from "./import.js";
import Structure from "./structure.js";

export type Namespace = Function | Import | Global | Structure ;

export default class File {
	owner: Project;
	name: string;
	path: string;

	namespace: { [key: string]: Namespace };

	constructor(owner: Project, path: string, name: string) {
		this.owner = owner;
		this.name = name;
		this.path = path;

		this.namespace = {};
		Ingest(this, Parse(
			fs.readFileSync(this.path, "utf-8"),
			this.path,
			this.name
		));
	}
}


function Ingest(file: File, syntax: Term_Program) {

}