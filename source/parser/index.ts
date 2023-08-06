import { ParseError } from "../bnf/shared.js";
import * as Syntax from "../bnf/syntax.js";


export function Parse(data: string, path: string) {
	const res = Syntax.Parse_Program(data, true);

	if (res instanceof ParseError) return;
}


export {
	ParseError
}