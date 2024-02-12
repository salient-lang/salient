import Structure from "~/compiler/structure.ts";
import { Intrinsic } from "~/compiler/intrinsic.ts";
import { Namespace } from "~/compiler/file.ts";

export type CompositeType = Structure | Structure;
export type SolidType = Intrinsic | Structure;

export function IsCompositeType(a: Namespace): a is CompositeType {
	if (a instanceof Structure) return true;

	return false;
}

export function IsSolidType(a: Namespace): a is SolidType {
	if (a instanceof Intrinsic) return true;
	if (IsCompositeType(a)) return true;

	return false;
}