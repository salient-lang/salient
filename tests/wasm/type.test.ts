import { describe, it } from 'mocha';
import { expect } from 'chai';

import { EncodeSignedLEB, EncodeUnsignedLEB } from "../../bin/wasm/type.js";


function toHex(arr: number[]) {
	return arr.map(x => x.toString(16).padStart(2, "0")).join("");
}

describe('EncodeSignedLEB', () => {
	it('zero encoding', () => {
		expect(toHex(EncodeSignedLEB(0))).to.deep.equal("00");
	});

	it('small positive integer', () => {
		expect(toHex(EncodeSignedLEB(8))).to.deep.equal("08");
		expect(toHex(EncodeSignedLEB(10))).to.deep.equal("0a");
		expect(toHex(EncodeSignedLEB(100))).to.deep.equal("e400");
		expect(toHex(EncodeSignedLEB(123456))).to.deep.equal("c0c407");
		expect(toHex(EncodeSignedLEB(2141192192))).to.deep.equal("808080fd07");
	});

	it('small negative integer', () => {
		expect(toHex(EncodeSignedLEB(-100))).to.deep.equal("9c7f");
	});

	it('should throw an error for non-integers', () => {
		expect(() => EncodeSignedLEB(12.34)).to.throw();
	});
});

describe('EncodeUnsignedLEB', () => {
	it('zero encoding', () => {
		expect(toHex(EncodeUnsignedLEB(0))).to.deep.equal("00");
	});

	it('small integer', () => {
		expect(toHex(EncodeUnsignedLEB(1))).to.deep.equal("01");
		expect(toHex(EncodeUnsignedLEB(8))).to.deep.equal("08");
		expect(toHex(EncodeUnsignedLEB(127))).to.deep.equal("7f");
		expect(toHex(EncodeUnsignedLEB(128))).to.deep.equal("8001");
		expect(toHex(EncodeUnsignedLEB(255))).to.deep.equal("ff01");
		expect(toHex(EncodeUnsignedLEB(256))).to.deep.equal("8002");
		expect(toHex(EncodeUnsignedLEB(624485))).to.deep.equal("e58e26");
	});

	it('should throw an error for non-integers', () => {
		expect(() => EncodeUnsignedLEB(12.34)).to.throw();
	});
	it('should throw an error for negative integers', () => {
		expect(() => EncodeUnsignedLEB(-12)).to.throw();
	});
});