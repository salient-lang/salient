import { AnyToken, ParseTokens } from "~/parser/tokenizer.ts";
import { ParseContext } from "~/parser/index.ts";
import { Expression } from "~/parser/expression.ts";
import { Reference } from "~/parser.ts";


console.time("tokenize");
const tokens = ParseTokens("a#[23] * 2 + 234 - -134");
console.timeEnd("tokenize");

if (tokens instanceof Reference) throw new Error(`Unexpected character at ${tokens.toString()}`);

const ctx = new ParseContext(tokens as AnyToken[]);
console.time("parse");
const tree = Expression(ctx);
console.timeEnd("parse");
console.log(ctx.completed())
console.log(tree);
if (tree) console.log(tree.reference())