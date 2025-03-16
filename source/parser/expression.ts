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



export class ConstantAST {
	readonly token;

	constructor (token: TokenString | TokenBoolean | TokenInteger | TokenFloat) {
		this.token = token;
	}

	static try (token: AnyToken) {
		if (token instanceof TokenString)  return new ConstantAST(token);
		if (token instanceof TokenBoolean) return new ConstantAST(token);
		if (token instanceof TokenInteger) return new ConstantAST(token);
		if (token instanceof TokenFloat)   return new ConstantAST(token);

		return null;
	}

	reference () { return this.token.ref; }
}

function ExprValue (ctx: ParseContext) {
	const checkpoint = ctx.checkpoint();
	const token = ctx.next();
	if (!token) return null;

	const constant = ConstantAST.try(token);
	if (constant) return constant;
	if (token instanceof TokenName) return token;

	checkpoint.restore();
	return null;
}




function ExprPrefix (ctx: ParseContext) {
	const checkpoint = ctx.checkpoint();
	const token = ctx.next();

	if (!(token instanceof TokenSymbol) || !prefixSet.has(token.type)) {
		checkpoint.restore();
		return null;
	}

	return token;
}

function ExprArgument (ctx: ParseContext) {
	const checkpoint = ctx.checkpoint();
	const prefix = ExprPrefix(ctx);
	const value = ExprValue(ctx);

	if (!value) {
		checkpoint.restore();
		return null;
	}

	return new ExpressionArgumentAST(prefix, value);
}

export class ExpressionArgumentAST {
	prefix: TokenSymbol | null;
	value:  ConstantAST | TokenName;

	constructor (prefix: TokenSymbol | null, value: ConstantAST | TokenName) {
		this.prefix = prefix;
		this.value = value;
	}

	reference () {
		const ref = this.value instanceof TokenName ? this.value.ref.clone() : this.value.reference();
		if (this.prefix) ref.span(this.prefix.ref);

		return ref;
	}
}


export class InfixAST {
	readonly lhs: ExpressionArgumentAST;
	readonly op:  TokenSymbol;
	readonly rhs: ExpressionArgumentAST;

	constructor (lhs: ExpressionArgumentAST, op: TokenSymbol, rhs: ExpressionArgumentAST) {
		this.lhs = lhs;
		this.op  = op;
		this.rhs = rhs;
	}

	reference () {
		const ref = this.lhs.reference();
		ref.span(this.rhs.reference());
		return ref;
	}
}

class ExpressionChunk {
	readonly operator: TokenSymbol;
	readonly rhs: ExpressionArgumentAST;

	constructor (op: TokenSymbol, rhs: ExpressionArgumentAST) {
		this.operator = op;
		this.rhs = rhs;
	}
}

export class ExpressionAST {
	readonly lhs: ExpressionArgumentAST;
	readonly chunks: ExpressionChunk[];

	constructor (lhs: ExpressionArgumentAST, chunks: ExpressionChunk[]) {
		this.lhs    = lhs;
		this.chunks = chunks;
	}

	static try (ctx: ParseContext) {
		const lhs = ExprArgument(ctx);
		if (!lhs) return null;

		const chunks = new Array<ExpressionChunk>();
		let checkpoint = ctx.checkpoint();
		while (true) {
			const operator = ctx.next();
			if (!(operator instanceof TokenSymbol) || !infixSet.has(operator.type)) {
				checkpoint.restore();
				break;
			}

			const rhs = ExprArgument(ctx);
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