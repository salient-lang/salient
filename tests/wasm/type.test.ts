import { describe, it } from 'mocha';
import { expect } from 'chai';

import { EncodeI32, EncodeU32 } from "../../source/wasm/type";


function toHex(arr: number[]) {
	return arr.map(x => x.toString(16).padStart(2, "0")).join("");
}

describe('EncodeI32', () => {
	it('zero encoding', () => {
		expect(toHex(EncodeI32(0))).to.deep.equal("00");
	});

	it('small positive integer', () => {
		expect(toHex(EncodeI32(8))).to.deep.equal("08");
		expect(toHex(EncodeI32(10))).to.deep.equal("0a");
		expect(toHex(EncodeI32(100))).to.deep.equal("e400");
		expect(toHex(EncodeI32(123456))).to.deep.equal("c0c407");
		expect(toHex(EncodeI32(2141192192))).to.deep.equal("808080fd07");
	});

	it('small negative integer', () => {
		expect(toHex(EncodeI32(-100))).to.deep.equal("9c7f");
	});

	it('should throw an error for non-integers', () => {
		expect(() => EncodeI32(12.34)).to.throw();
	});
});

describe('EncodeU32', () => {
	it('zero encoding', () => {
		expect(toHex(EncodeU32(0))).to.deep.equal("00");
	});

	it('small integer', () => {
		expect(toHex(EncodeU32(1))).to.deep.equal("01");
		expect(toHex(EncodeU32(8))).to.deep.equal("08");
		expect(toHex(EncodeU32(127))).to.deep.equal("7f");
		expect(toHex(EncodeU32(128))).to.deep.equal("8001");
		expect(toHex(EncodeU32(624485))).to.deep.equal("e58e26");
	});

	it('should throw an error for non-integers', () => {
		expect(() => EncodeU32(12.34)).to.throw();
	});
	it('should throw an error for negative integers', () => {
		expect(() => EncodeU32(-12)).to.throw();
	});
});