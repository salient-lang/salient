import type * as _Shared from './shared.js';
export type _Literal = { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange };
export type Term_Program = {
	type: 'program',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)*', value: Array<{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Stmt_top
	]
}>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Program (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Program,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Stmt_top = {
	type: 'stmt_top',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Function | Term_Structure | Term_External | Term_Test)
	]
}
export declare function Parse_Stmt_top (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Stmt_top,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_W = {
	type: 'w',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal & {value: "\x20"} | _Literal & {value: "\x09"} | Term_Nl | Term_Comment)
	]
}
export declare function Parse_W (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_W,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Nl = {
	type: 'nl',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal & {value: "\x0d\x0a"} | _Literal & {value: "\x0a"})
	]
}
export declare function Parse_Nl (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Nl,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Digit = {
	type: 'digit',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Digit (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Digit,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Digit_nz = {
	type: 'digit_nz',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Digit_nz (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Digit_nz,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Letter = {
	type: 'letter',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal | _Literal)
	]
}
export declare function Parse_Letter (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Letter,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Terminate = {
	type: 'terminate',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)*', value: Array<Term_W>, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
		_Literal & {value: "\x3b"},
		{ type: '(...)*', value: Array<Term_W>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
	]
}
export declare function Parse_Terminate (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Terminate,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Comment = {
	type: 'comment',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Comment_single | Term_Comment_multi)
	]
}
export declare function Parse_Comment (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Comment,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Comment_single = {
	type: 'comment_single',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal & {value: "\x2f\x2f"},
		_Literal,
		{ type: '(...)?', value: [] | [Term_Nl], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Comment_single (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Comment_single,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Comment_multi = {
	type: 'comment_multi',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal & {value: "\x2f\x2a"},
		{ type: '(...)*', value: Array<(_Literal & {value: "\x5c\x2a"} | _Literal)>, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
		_Literal & {value: "\x2a\x2f"}
	]
}
export declare function Parse_Comment_multi (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Comment_multi,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Constant = {
	type: 'constant',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Boolean | Term_String | Term_Float | Term_Integer)
	]
}
export declare function Parse_Constant (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Constant,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_String = {
	type: 'string',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_String_plain | Term_String_template)
	]
}
export declare function Parse_String (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_String,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_String_plain = {
	type: 'string_plain',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)*', value: Array<(Term_Str_hex_u8 | Term_Str_escape | _Literal)>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_String_plain (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_String_plain,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Str_hex_u8 = {
	type: 'str_hex_u8',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Str_hex_u8 (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Str_hex_u8,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Str_escape = {
	type: 'str_escape',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Str_escape (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Str_escape,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_String_template = {
	type: 'string_template',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)*', value: Array<(Term_Str_hex_u8 | Term_Str_escape | Term_String_tag | _Literal)>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_String_template (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_String_template,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_String_tag = {
	type: 'string_tag',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr
	]
}
export declare function Parse_String_tag (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_String_tag,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Boolean = {
	type: 'boolean',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal & {value: "true"} | _Literal & {value: "false"})
	]
}
export declare function Parse_Boolean (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Boolean,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Void = {
	type: 'void',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal & {value: "void"}
	]
}
export declare function Parse_Void (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Void,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Hexidecimal = {
	type: 'hexidecimal',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal | _Literal)
	]
}
export declare function Parse_Hexidecimal (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Hexidecimal,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Integer = {
	type: 'integer',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Integer (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Integer,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Digitish = {
	type: 'digitish',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Digit)
	]
}
export declare function Parse_Digitish (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Digitish,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Integer_u = {
	type: 'integer_u',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		({
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Digit_nz,
		{ type: '(...)*', value: Array<Term_Digitish>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
} | Term_Zero)
	]
}
export declare function Parse_Integer_u (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Integer_u,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Zero = {
	type: 'zero',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal & {value: "0"}
	]
}
export declare function Parse_Zero (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Zero,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Float = {
	type: 'float',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Float (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Float,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Name = {
	type: 'name',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Name (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Name,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Access = {
	type: 'access',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Name,
		{ type: '(...)*', value: Array<{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Accessor
	]
}>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Access (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Access,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Accessor = {
	type: 'accessor',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Access_static | Term_Access_dynamic | Term_Access_comp)
	]
}
export declare function Parse_Accessor (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Accessor,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Access_static = {
	type: 'access_static',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Access_static (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Access_static,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Access_dynamic = {
	type: 'access_dynamic',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [

	]
}
export declare function Parse_Access_dynamic (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Access_dynamic,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Access_comp = {
	type: 'access_comp',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [

	]
}
export declare function Parse_Access_comp (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Access_comp,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Declare = {
	type: 'declare',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Name,
		{ type: '(...)?', value: [] | [{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Access
	]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
		{ type: '(...)?', value: [] | [{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr
	]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Declare (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Declare,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Assign = {
	type: 'assign',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Access,
		Term_Expr
	]
}
export declare function Parse_Assign (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Assign,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Structure = {
	type: 'structure',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal,
		{ type: '(...)?', value: [] | [Term_Struct_type], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
		{ type: '(...)*', value: Array<Term_Struct_stmt>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Structure (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Structure,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Struct_type = {
	type: 'struct_type',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Struct_type (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Struct_type,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Struct_stmt = {
	type: 'struct_stmt',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Struct_attr | Term_Struct_spread)
	]
}
export declare function Parse_Struct_stmt (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Struct_stmt,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Struct_attr = {
	type: 'struct_attr',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal,
		Term_Access
	]
}
export declare function Parse_Struct_attr (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Struct_attr,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Struct_spread = {
	type: 'struct_spread',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Access
	]
}
export declare function Parse_Struct_spread (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Struct_spread,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Container = {
	type: 'container',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)?', value: [] | [{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Container_item,
		{ type: '(...)*', value: Array<{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Container_item
	]
}>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Container (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Container,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Container_item = {
	type: 'container_item',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Container_map | Term_Container_value)
	]
}
export declare function Parse_Container_item (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Container_item,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Container_map = {
	type: 'container_map',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Name,
		Term_Expr
	]
}
export declare function Parse_Container_map (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Container_map,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Container_value = {
	type: 'container_value',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr
	]
}
export declare function Parse_Container_value (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Container_value,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Function = {
	type: 'function',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Func_head,
		(Term_Block | _Literal & {value: "\x3b"})
	]
}
export declare function Parse_Function (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Function,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Func_head = {
	type: 'func_head',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal,
		Term_Func_args,
		Term_Access
	]
}
export declare function Parse_Func_head (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Func_head,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Func_args = {
	type: 'func_args',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)?', value: [] | [{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Func_arg,
		{ type: '(...)*', value: Array<{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Func_arg
	]
}>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Func_args (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Func_args,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Func_arg = {
	type: 'func_arg',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal,
		Term_Access
	]
}
export declare function Parse_Func_arg (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Func_arg,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Block = {
	type: 'block',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)*', value: Array<Term_Block_stmt>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Block (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Block,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Block_stmt = {
	type: 'block_stmt',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Assign | Term_Declare | Term_Return | Term_Lift | Term_Statement)
	]
}
export declare function Parse_Block_stmt (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Block_stmt,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Func_call = {
	type: 'func_call',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Access,
		Term_Func_call_body
	]
}
export declare function Parse_Func_call (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Func_call,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Func_call_body = {
	type: 'func_call_body',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)?', value: [] | [{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr,
		{ type: '(...)*', value: Array<{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr
	]
}>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Func_call_body (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Func_call_body,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Return = {
	type: 'return',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)?', value: [] | [_Literal & {value: "\x5ftail"}], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
		{ type: '(...)?', value: [] | [{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr
	]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Return (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Return,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Lift = {
	type: 'lift',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr
	]
}
export declare function Parse_Lift (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Lift,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr = {
	type: 'expr',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr_arg,
		{ type: '(...)*', value: Array<{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal,
		Term_Expr_arg
	]
}>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Expr (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_prefix = {
	type: 'expr_prefix',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal & {value: "\x21"} | _Literal & {value: "\x2d"})
	]
}
export declare function Parse_Expr_prefix (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_prefix,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_infix = {
	type: 'expr_infix',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal & {value: "\x26\x26"} | _Literal & {value: "\x7c\x7c"} | _Literal & {value: "\x5e"} | _Literal & {value: "\x3d\x3d"} | _Literal & {value: "\x21\x3d"} | _Literal & {value: "\x3c\x3d"} | _Literal & {value: "\x3e\x3d"} | _Literal & {value: "\x3c"} | _Literal & {value: "\x3e"} | _Literal & {value: "\x25"} | _Literal & {value: "\x2a"} | _Literal & {value: "\x2f"} | _Literal & {value: "\x2b"} | _Literal & {value: "\x2d"} | _Literal & {value: "as"} | _Literal & {value: "instanceof"} | _Literal & {value: "\x2e"} | _Literal & {value: "\x2d\x3e"})
	]
}
export declare function Parse_Expr_infix (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_infix,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_postfix = {
	type: 'expr_postfix',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Expr_call | Term_Expr_get | Term_Expr_param | Term_Expr_loan)
	]
}
export declare function Parse_Expr_postfix (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_postfix,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_param = {
	type: 'expr_param',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)?', value: [] | [Term_Arg_list], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Expr_param (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_param,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_call = {
	type: 'expr_call',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)?', value: [] | [Term_Arg_list], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Expr_call (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_call,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_get = {
	type: 'expr_get',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)?', value: [] | [Term_Arg_list], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Expr_get (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_get,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_loan = {
	type: 'expr_loan',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal & {value: "\x40"} | _Literal & {value: "\x24"})
	]
}
export declare function Parse_Expr_loan (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_loan,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_arg = {
	type: 'expr_arg',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)?', value: [] | [Term_Expr_prefix], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
		Term_Expr_val,
		{ type: '(...)*', value: Array<Term_Expr_postfix>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Expr_arg (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_arg,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_val = {
	type: 'expr_val',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Constant | Term_Expr_brackets | Term_Block | Term_Container | Term_If | Term_Name)
	]
}
export declare function Parse_Expr_val (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_val,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_brackets = {
	type: 'expr_brackets',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr
	]
}
export declare function Parse_Expr_brackets (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_brackets,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Arg_list = {
	type: 'arg_list',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr,
		{ type: '(...)*', value: Array<{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr
	]
}>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Arg_list (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Arg_list,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_If = {
	type: 'if',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr,
		Term_Expr,
		{ type: '(...)?', value: [] | [{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr
	]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_If (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_If,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Statement = {
	type: 'statement',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr
	]
}
export declare function Parse_Statement (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Statement,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_External = {
	type: 'external',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Ext_import | Term_Ext_export)
	]
}
export declare function Parse_External (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_External,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Ext_import = {
	type: 'ext_import',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)*', value: Array<Term_Ext_imports>, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
		Term_String_plain
	]
}
export declare function Parse_Ext_import (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Ext_import,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Ext_imports = {
	type: 'ext_imports',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Function | Term_Ext_import_var)
	]
}
export declare function Parse_Ext_imports (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Ext_imports,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Ext_import_var = {
	type: 'ext_import_var',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Name,
		Term_Access
	]
}
export declare function Parse_Ext_import_var (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Ext_import_var,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Ext_export = {
	type: 'ext_export',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal & {value: "export"}
	]
}
export declare function Parse_Ext_export (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Ext_export,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Test = {
	type: 'test',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_String_plain,
		Term_Block
	]
}
export declare function Parse_Test (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Test,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}
