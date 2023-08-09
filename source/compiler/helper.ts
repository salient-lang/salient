import type { Term_Access, Term_Access_comp, Term_Access_dynamic, Term_Access_static, Term_Name } from "../bnf/syntax.js";
export type FlatAccess = (Term_Name | Term_Access_static | Term_Access_dynamic | Term_Access_comp)[];


export function FlattenAccess(syntax: Term_Access): FlatAccess {
	return [
		syntax.value[0],
		...syntax.value[1].value.map(x => x.value[0].value[0])
	].reverse();
}


export function FlatAccessToStr(access: FlatAccess): string {
	return access.map(x =>
		x.type === "access_static" ? `.${x.value}`
		: x.type === "name" ? `.${x.value}`
		: x.type === "access_dynamic" ? "[]"
		: x.type === "access_comp" ? "#[]"
		: "UNK"
	).join("")
}