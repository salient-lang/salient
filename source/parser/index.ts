import { AnyToken, TokenComment } from "~/parser/tokenizer.ts";

export class ParseContext {
	readonly tokens: AnyToken[];
	private  cursor: number;
	private  reach:  number;

	constructor (tokens: AnyToken[]) {
		this.tokens = tokens;
		this.cursor = 0;
		this.reach  = 0;
	}

	peak (): AnyToken | null { return this.tokens[this.cursor] || null; }
	next (skipWhiteSpace = true): AnyToken | null {
		if (skipWhiteSpace) this.skipWhiteSpace();

		const t = this.peak();
		this.cursor++;

		return t;
	}

	skipWhiteSpace() {
		let t = this.peak();

		while (t && t instanceof TokenComment) {
			t = this.peak();
			this.cursor++;
		}
	}

	completed () {
		return this.cursor >= this.tokens.length;
	}
	reached () { return this.tokens[this.reach]; }

	checkpoint() { return new ParseContextCheckpoint(this, this.cursor); }
	restore (checkpoint: ParseContextCheckpoint) {
		this.reach = Math.max(this.reach, this.cursor);
		this.cursor = checkpoint.state;
	}
}

export class ParseContextCheckpoint {
	readonly ctx:   ParseContext;
	readonly state: number;

	constructor (ctx: ParseContext, state: number) {
		this.ctx   = ctx;
		this.state = state;
	}

	restore() {
		this.ctx.restore(this);
	}
}