import Structure from "~/compiler/structure.ts";
import { Intrinsic } from "~/compiler/intrinsic.ts";

export type SolidType = Intrinsic | Structure;

// deno-lint-ignore no-explicit-any
export function IsSolidType(a: any): a is SolidType {
	if (a instanceof CompositeType) return true;
	if (a instanceof Intrinsic) return true;
	if (a instanceof Structure) return true;

	return false;
}

export class CompositeType {
	type: Structure

	constructor(type: Structure) {
		this.type = type;
	}
}