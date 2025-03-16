import { AnyToken, TokenBoolean, TokenFloat, TokenInteger, TokenName, TokenString, TokenSymbol } from "~/parser/tokenizer.ts";
import type { ParseContext } from "~/parser/index.ts";

const infixSet = new Set([
	TokenSymbol.addition,
	TokenSymbol.subtraction,
	TokenSymbol.divide,
	TokenSymbol.addition,
	TokenSymbol.subtraction,
	TokenSymbol.multiply,
	TokenSymbol.divide,
	TokenSymbol.escape,
	TokenSymbol.remainder,
	TokenSymbol.append,
	TokenSymbol.type,
	TokenSymbol.assign,
	TokenSymbol.equal,
	TokenSymbol.same,
	TokenSymbol.notEqual,
	TokenSymbol.notSame,
	TokenSymbol.lt,
	TokenSymbol.le,
	TokenSymbol.gt,
	TokenSymbol.ge,
	TokenSymbol.bAnd,
	TokenSymbol.bOr,
	TokenSymbol.and,
	TokenSymbol.or,
	TokenSymbol.member,
	TokenSymbol.instance,
	TokenSymbol.typeof,
]);

const prefixSet = new Set([
	TokenSymbol.not,
	TokenSymbol.subtraction,
	TokenSymbol.reference,
	TokenSymbol.loan,
	TokenSymbol.loanMut,
	TokenSymbol.spread,
]);



export class LiteralAST {
	readonly token;

	constructor (token: TokenString | TokenBoolean | TokenInteger | TokenFloat) {
		this.token = token;
	}

	static try (token: AnyToken) {
		if (token instanceof TokenString)  return new LiteralAST(token);
		if (token instanceof TokenBoolean) return new LiteralAST(token);
		if (token instanceof TokenInteger) return new LiteralAST(token);
		if (token instanceof TokenFloat)   return new LiteralAST(token);

		return null;
	}

	reference () { return this.token.ref; }
}

function Value (ctx: ParseContext) {
	const checkpoint = ctx.checkpoint();
	const token = ctx.next();
	if (!token) return null;

	const constant = LiteralAST.try(token);
	if (constant) return new ValueAST(constant);
	if (token instanceof TokenName) return new ValueAST(token);

	checkpoint.restore();
	return null;
}




function Prefix (ctx: ParseContext) {
	const checkpoint = ctx.checkpoint();
	const token = ctx.next();

	if (!(token instanceof TokenSymbol) || !prefixSet.has(token.type)) {
		checkpoint.restore();
		return null;
	}

	return token;
}

function Operand (ctx: ParseContext) {
	const checkpoint = ctx.checkpoint();
	const prefix = Prefix(ctx);
	const value = Value(ctx);

	if (!value) {
		checkpoint.restore();
		return null;
	}

	if (prefix) return new OperandAST(new PrefixAST(prefix, value));
	return new OperandAST(value);
}

export class ValueAST {
	value: LiteralAST | TokenName;

	constructor (value: LiteralAST | TokenName) {
		this.value = value;
	}

	reference () {
		return this.value instanceof TokenName ? this.value.ref.clone() : this.value.reference();
	}
}

export class PrefixAST {
	prefix: TokenSymbol;
	value: ValueAST;

	constructor (prefix: TokenSymbol, value: ValueAST) {
		this.prefix = prefix;
		this.value = value;
	}

	reference () {
		const ref = this.value.reference();
		ref.span(this.prefix.ref);
		return ref;
	}
}

export class OperandAST {
	value: PrefixAST | ValueAST;

	constructor (value: PrefixAST | ValueAST) {
		this.value = value;
	}

	reference () {
		return this.value.reference();
	}
}

export class ExpressionArgumentAST {
	prefix: TokenSymbol | null;
	value:  LiteralAST | TokenName;

	constructor (prefix: TokenSymbol | null, value: LiteralAST | TokenName) {
		this.prefix = prefix;
		this.value = value;
	}

	reference () {
		const ref = this.value instanceof TokenName ? this.value.ref.clone() : this.value.reference();
		if (this.prefix) ref.span(this.prefix.ref);

		return ref;
	}
}

class ExpressionChunk {
	readonly operator: TokenSymbol;
	readonly rhs: OperandAST;

	constructor (op: TokenSymbol, rhs: OperandAST) {
		this.operator = op;
		this.rhs = rhs;
	}
}

export class ExpressionAST {
	readonly lhs: OperandAST;
	readonly chunks: ExpressionChunk[];

	constructor (lhs: OperandAST, chunks: ExpressionChunk[]) {
		this.lhs    = lhs;
		this.chunks = chunks;
	}

	static try (ctx: ParseContext) {
		const lhs = Operand(ctx);
		if (!lhs) return null;

		const chunks = new Array<ExpressionChunk>();
		let checkpoint = ctx.checkpoint();
		while (true) {
			const operator = ctx.next();
			if (!(operator instanceof TokenSymbol) || !infixSet.has(operator.type)) {
				checkpoint.restore();
				break;
			}

			const rhs = Operand(ctx);
			if (!rhs) {
				checkpoint.restore();
				break;
			}

			chunks.push(new ExpressionChunk(operator, rhs));
			checkpoint = ctx.checkpoint();
		}

		return new ExpressionAST(lhs, chunks);
	}

	reference () {
		const ref = this.lhs.reference();
		const last = this.chunks[this.chunks.length-1];
		if (!last) return ref;

		return ref.span(last.rhs.reference())
	}
}


export function Expression (ctx: ParseContext) {
	return ExpressionAST.try(ctx);
}