# Structure

```bnf
struct ::= "struct" name struct_type? "{" struct_stmt* "}" ;
	struct_type   ::= %( ":" w* ) ...name %w* ;
	struct_stmt   ::= struct_attr | struct_spread ;
		struct_attr   ::= ...name ":" access ";" ;
		struct_spread ::=  "..." access ";" ;
```


## Memory Layout

| Struct Type | Attribute Storage Method | Gaps | Ordered |
| :-: | :- | :-: | :-: |
| Sparse | Stored in order with gaps between them to ensure each attribute is correctly aligned | Yes | Yes |
| Aligned | Stored with gaps to ensure alignment, however reorders such to minimise the required gaps | Yes | No |
| Linear | Stored in order with no gaps between attributes | No | Yes |
| Compact | Stored with no gaps in such an order as to maximise alignment | No | No |

*Defaults to sparse*