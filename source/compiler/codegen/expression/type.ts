import Structure from "~/compiler/structure.ts";
import { Intrinsic } from "~/compiler/intrinsic.ts";
import { Namespace } from "~/compiler/file.ts";

export type SolidType = Intrinsic | Structure;

export function IsSolidType(a: Namespace): a is SolidType {
	if (a instanceof CompositeType) return true;
	if (a instanceof Intrinsic) return true;

	return false;
}

export class CompositeType {
	type: Structure

	constructor(type: Structure) {
		this.type = type;
	}
}