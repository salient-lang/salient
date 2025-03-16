import { AnyToken, ParseTokens } from "~/parser/tokenizer.ts";
import { ParseContext } from "~/parser/index.ts";
import { Expression } from "~/parser/expression.ts";
import { Reference } from "~/parser.ts";


console.time("tokenize");
const tokens = ParseTokens("3 + 2 * 3");
console.timeEnd("tokenize");

if (tokens instanceof Reference) throw new Error(`Unexpected character at ${tokens.toString()}`);

const ctx = new ParseContext(tokens as AnyToken[]);
const tree = Expression(ctx);
console.log(tree);
if (tree) console.log(tree.reference())