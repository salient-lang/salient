import * as Type from "~/wasm/type.ts";
import Instruction, { Any } from "~/wasm/instruction/index.ts";
import Module from "~/wasm/module.ts";

export type AnyInstruction = Any;

export {
	Instruction,
	Module,
	Type
};
