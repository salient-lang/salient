import { ParseTokens } from "~/parser/tokenizer.ts";

const decoder = new TextDecoder();
const bytes = await Deno.readFile("test.txt");
const data = decoder.decode(bytes);


console.time("tokenize");
const result = ParseTokens(data);
console.timeEnd("tokenize");
// console.log(result);