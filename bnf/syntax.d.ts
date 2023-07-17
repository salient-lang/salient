import * as _Shared from "./shared.js";
export type Term_Program = {
  type: "program", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Stmt_top
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Program (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Program, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Stmt_top = {
  type: "stmt_top", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Function | Term_Impl | Term_Struct | Term_Trait | Term_Library | Term_External | Term_Include)
  ]
}
export declare function Parse_Stmt_top (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Stmt_top, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_W = {
  type: "w", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x20", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x09", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | Term_Nl | Term_Comment)
  ]
}
export declare function Parse_W (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_W, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Nl = {
  type: "nl", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x0d\x0a", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x0a", start: number, end: number, count: number, ref: _Shared.ReferenceRange })
  ]
}
export declare function Parse_Nl (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Nl, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Digit = {
  type: "digit", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Digit (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Digit, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Digit_nz = {
  type: "digit_nz", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Digit_nz (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Digit_nz, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Letter = {
  type: "letter", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange })
  ]
}
export declare function Parse_Letter (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Letter, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Comment = {
  type: "comment", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Comment_single | Term_Comment_multi)
  ]
}
export declare function Parse_Comment (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Comment, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Comment_single = {
  type: "comment_single", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "\x2f\x2f", start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: [] | [Term_Nl], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Comment_single (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Comment_single, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Comment_multi = {
  type: "comment_multi", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "\x2f\x2a", start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: ({ type: "literal", value: "\x5c\x2a", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: "\x2a\x2f", start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Comment_multi (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Comment_multi, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Constant = {
  type: "constant", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Boolean | Term_Void | Term_String | Term_Hexadecimal | Term_Octal | Term_Binary | Term_Float | Term_Integer)
  ]
}
export declare function Parse_Constant (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Constant, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_String = {
  type: "string", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_String_unicode | Term_String_text)
  ]
}
export declare function Parse_String (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_String, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_String_unicode = {
  type: "string_unicode", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: ({
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "\x5c", start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
} | { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_String_unicode (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_String_unicode, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_String_text = {
  type: "string_text", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: ({
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "\x5c", start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
} | { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_String_text (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_String_text, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Hexadecimal = {
  type: "hexadecimal", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "0x", start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Hexadecimal (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Hexadecimal, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Hex_char = {
  type: "hex_char", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Digit | { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange })
  ]
}
export declare function Parse_Hex_char (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Hex_char, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Octal = {
  type: "octal", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "0o", start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Octal (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Octal, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Octal_char = {
  type: "octal_char", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Octal_char (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Octal_char, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Binary = {
  type: "binary", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "0b", start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: ({ type: "literal", value: "0", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "1", start: number, end: number, count: number, ref: _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Binary (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Binary, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Boolean = {
  type: "boolean", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "true", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "false", start: number, end: number, count: number, ref: _Shared.ReferenceRange })
  ]
}
export declare function Parse_Boolean (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Boolean, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Void = {
  type: "void", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "void", start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Void (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Void, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Integer = {
  type: "integer", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [{ type: "literal", value: "\x2d", start: number, end: number, count: number, ref: _Shared.ReferenceRange }], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Integer (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Integer, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Integer_u = {
  type: "integer_u", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    ({
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Digit_nz,
    { type: "(...)", value: Term_Digit[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
} | Term_Zero)
  ]
}
export declare function Parse_Integer_u (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Integer_u, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Zero = {
  type: "zero", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "0", start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Zero (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Zero, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Float = {
  type: "float", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: "\x2e", start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "e", start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Float (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Float, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Access = {
  type: "access", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Access_static | Term_Access_dynamic | Term_Access_template)
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Access (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Access_static = {
  type: "access_static", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Access_static (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access_static, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Access_dynamic = {
  type: "access_dynamic", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Call_args
  ]
}
export declare function Parse_Access_dynamic (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access_dynamic, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Access_template = {
  type: "access_template", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Access_template_args
  ]
}
export declare function Parse_Access_template (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access_template, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Access_template_args = {
  type: "access_template_args", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Access_template_arg,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Access_template_arg
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Access_template_args (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access_template_args, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Access_template_arg = {
  type: "access_template_arg", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Constant | Term_Data_type)
  ]
}
export declare function Parse_Access_template_arg (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access_template_arg, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Variable = {
  type: "variable", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Access_static | Term_Access_dynamic)
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Variable (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Variable, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Name = {
  type: "name", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: (Term_Letter | { type: "literal", value: "\x5f", start: number, end: number, count: number, ref: _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: (Term_Letter | Term_Digit | { type: "literal", value: "\x5f", start: number, end: number, count: number, ref: _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Name (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Name, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Data_type = {
  type: "data_type", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Access_static | Term_Access_template)
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Data_type (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Data_type, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Data_type_lending = {
  type: "data_type_lending", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x40", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x24", start: number, end: number, count: number, ref: _Shared.ReferenceRange })
  ]
}
export declare function Parse_Data_type_lending (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Data_type_lending, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Declare = {
  type: "declare", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Data_type
  ]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Expr
  ]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Declare (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Declare, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Assign = {
  type: "assign", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Variable,
    Term_Expr
  ]
}
export declare function Parse_Assign (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Assign, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Function = {
  type: "function", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Func_head,
    (Term_Function_body | { type: "literal", value: "\x3b", start: number, end: number, count: number, ref: _Shared.ReferenceRange })
  ]
}
export declare function Parse_Function (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Function, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Func_head = {
  type: "func_head", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    Term_Func_arguments,
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Data_type
  ]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Func_head (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Func_head, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Func_arguments = {
  type: "func_arguments", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Func_arg,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Func_arg
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Func_arguments (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Func_arguments, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Func_arg = {
  type: "func_arg", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    Term_Data_type
  ]
}
export declare function Parse_Func_arg (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Func_arg, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Function_body = {
  type: "function_body", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Func_stmt
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Function_body (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Function_body, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Func_stmt = {
  type: "func_stmt", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_If | Term_When | Term_Return | Term_Declare | Term_Assign | Term_Call_procedure)
  ]
}
export declare function Parse_Func_stmt (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Func_stmt, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Function_outline = {
  type: "function_outline", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Func_head
  ]
}
export declare function Parse_Function_outline (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Function_outline, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Function_redirect = {
  type: "function_redirect", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_String,
    Term_Func_arguments,
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Data_type,
    { type: "(...)", value: Term_W[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Function_redirect (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Function_redirect, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Call = {
  type: "call", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Access,
    Term_Call_body
  ]
}
export declare function Parse_Call (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Call, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Call_body = {
  type: "call_body", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [Term_Call_args], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Call_body (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Call_body, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Call_args = {
  type: "call_args", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Expr,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Expr
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Call_args (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Call_args, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Call_procedure = {
  type: "call_procedure", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Call
  ]
}
export declare function Parse_Call_procedure (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Call_procedure, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Return = {
  type: "return", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Expr
  ]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Return (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Return, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Struct = {
  type: "struct", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    Term_Struct_body
  ]
}
export declare function Parse_Struct (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Struct, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Struct_body = {
  type: "struct_body", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Struct_stmt
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Struct_body (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Struct_body, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Struct_stmt = {
  type: "struct_stmt", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Struct_attribute | Term_Struct_attribute)
  ]
}
export declare function Parse_Struct_stmt (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Struct_stmt, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Struct_attribute = {
  type: "struct_attribute", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    Term_Data_type
  ]
}
export declare function Parse_Struct_attribute (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Struct_attribute, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Impl = {
  type: "impl", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Data_type,
    { type: "(...)", value: [] | [Term_Impl_for], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    Term_Impl_body
  ]
}
export declare function Parse_Impl (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Impl, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Impl_for = {
  type: "impl_for", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Data_type
  ]
}
export declare function Parse_Impl_for (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Impl_for, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Impl_body = {
  type: "impl_body", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Impl_stmt
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Impl_body (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Impl_body, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Impl_stmt = {
  type: "impl_stmt", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Function | Term_Template)
  ]
}
export declare function Parse_Impl_stmt (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Impl_stmt, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Trait = {
  type: "trait", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: [] | [Term_Trait_reliance], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    Term_Trait_body
  ]
}
export declare function Parse_Trait (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Trait, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Trait_reliance = {
  type: "trait_reliance", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Data_type,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Data_type
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Trait_reliance (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Trait_reliance, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Trait_body = {
  type: "trait_body", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Trait_stmt
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Trait_body (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Trait_body, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Trait_stmt = {
  type: "trait_stmt", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Function | Term_Template)
  ]
}
export declare function Parse_Trait_stmt (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Trait_stmt, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Expr_struct = {
  type: "expr_struct", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Data_type,
    Term_Expr_struct_body
  ]
}
export declare function Parse_Expr_struct (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_struct, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Expr_struct_body = {
  type: "expr_struct_body", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [Term_Expr_struct_args], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Expr_struct_body (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_struct_body, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Expr_struct_args = {
  type: "expr_struct_args", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Expr_struct_arg,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Expr_struct_arg
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Expr_struct_args (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_struct_args, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Expr_struct_arg = {
  type: "expr_struct_arg", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    Term_Expr
  ]
}
export declare function Parse_Expr_struct_arg (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_struct_arg, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Template = {
  type: "template", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Template_args
  ]
}
export declare function Parse_Template (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Template, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Template_args = {
  type: "template_args", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Struct_attribute,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Struct_attribute
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Template_args (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Template_args, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Expr = {
  type: "expr", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Expr_arg,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    Term_Expr_arg
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Expr (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Expr_left_oper = {
  type: "expr_left_oper", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x21", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x24", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x40", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x2d", start: number, end: number, count: number, ref: _Shared.ReferenceRange })
  ]
}
export declare function Parse_Expr_left_oper (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_left_oper, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Expr_middle_oper = {
  type: "expr_middle_oper", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x3f", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x3a", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x26\x26", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x7c\x7c", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x3d\x3d", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x21\x3d", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x3c\x3d", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x3e\x3d", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x3c", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x3e", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x25", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x2a", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x2f", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x2b", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x2d", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "\x2d\x3e", start: number, end: number, count: number, ref: _Shared.ReferenceRange })
  ]
}
export declare function Parse_Expr_middle_oper (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_middle_oper, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Expr_arg = {
  type: "expr_arg", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [Term_Expr_left_oper], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    (Term_Constant | Term_Expr_brackets | Term_Expr_struct | Term_Expr_val)
  ]
}
export declare function Parse_Expr_arg (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_arg, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Expr_val = {
  type: "expr_val", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Access,
    { type: "(...)", value: [] | [Term_Call_body], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Expr_val (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_val, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Expr_brackets = {
  type: "expr_brackets", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Expr
  ]
}
export declare function Parse_Expr_brackets (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_brackets, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Library = {
  type: "library", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Import | Term_Import)
  ]
}
export declare function Parse_Library (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Library, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Import = {
  type: "import", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_String,
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_Import (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Import, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Include = {
  type: "include", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    Term_String
  ]
}
export declare function Parse_Include (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Include, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Include_type = {
  type: "include_type", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "llvm", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "static", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "dynamic", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "object", start: number, end: number, count: number, ref: _Shared.ReferenceRange })
  ]
}
export declare function Parse_Include_type (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Include_type, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_External = {
  type: "external", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    Term_External_body
  ]
}
export declare function Parse_External (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_External, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_External_mode = {
  type: "external_mode", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "assume", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | { type: "literal", value: "export", start: number, end: number, count: number, ref: _Shared.ReferenceRange })
  ]
}
export declare function Parse_External_mode (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_External_mode, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_External_body = {
  type: "external_body", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_External_term,
    { type: "(...)", value: Term_W[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_External_body (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_External_body, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_External_term = {
  type: "external_term", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    (Term_Function_redirect | Term_Function_outline | Term_Type_def | Term_Struct)
  ]
}
export declare function Parse_External_term (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_External_term, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Type_def = {
  type: "type_def", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    Term_Integer
  ]
}
export declare function Parse_Type_def (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Type_def, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_If = {
  type: "if", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_If_stmt,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Elif_stmt
  ]
}[], start: number, end: number, count: number, ref: _Shared.ReferenceRange },
    { type: "(...)", value: [] | [Term_Else_stmt], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_If (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_If, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_If_stmt = {
  type: "if_stmt", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Expr,
    Term_Function_body
  ]
}
export declare function Parse_If_stmt (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_If_stmt, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Elif_stmt = {
  type: "elif_stmt", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Expr,
    Term_Function_body
  ]
}
export declare function Parse_Elif_stmt (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Elif_stmt, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_Else_stmt = {
  type: "else_stmt", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Function_body
  ]
}
export declare function Parse_Else_stmt (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Else_stmt, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_When = {
  type: "when", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    Term_Variable,
    { type: "(...)", value: Term_When_opt[], start: number, end: number, count: number, ref: _Shared.ReferenceRange }
  ]
}
export declare function Parse_When (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_When, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }

export type Term_When_opt = {
  type: "when_opt", start: number, end: number, count: number, ref: _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "default", start: number, end: number, count: number, ref: _Shared.ReferenceRange } | Term_Data_type),
    Term_Function_body
  ]
}
export declare function Parse_When_opt (i: string, refMapping?: boolean): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_When_opt, reachBytes: number, reach: null | _Shared.Reference, isPartial: boolean }
