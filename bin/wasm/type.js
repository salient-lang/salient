"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodeU32 = exports.EncodeI32 = exports.MakeLimitType = exports.MakeFuncType = exports.AtomType = void 0;
// https://webassembly.github.io/spec/core/binary/types.html
var AtomType;
(function (AtomType) {
    AtomType[AtomType["i32"] = 127] = "i32";
    AtomType[AtomType["i64"] = 126] = "i64";
    AtomType[AtomType["f32"] = 125] = "f32";
    AtomType[AtomType["f64"] = 124] = "f64";
    AtomType[AtomType["vectype"] = 123] = "vectype";
    // ref type
    AtomType[AtomType["funcref"] = 112] = "funcref";
    AtomType[AtomType["externref"] = 111] = "externref";
})(AtomType || (exports.AtomType = AtomType = {}));
function MakeFuncType(input, output) {
    throw new Error('Unimplemented');
}
exports.MakeFuncType = MakeFuncType;
function MakeLimitType(min, max) {
    if (!isFinite(min) || min < 0 || min % 1 !== 0)
        throw new Error(`Limit minimum must be a real unsigned integer not ${min}`);
    if (max) {
        if (!isFinite(max) || max < 0 || max % 1 !== 0)
            throw new Error(`Limit maximum must be a real unsigned integer not ${min}`);
        if (max < min)
            throw new Error(`Limit maximum must be greater than or equal to min (${min}<${max})`);
        return [0x00, ...EncodeU32(min), ...EncodeU32(max)];
    }
    return [0x00, ...EncodeU32(min)];
}
exports.MakeLimitType = MakeLimitType;
function EncodeI32(val) {
    if (val % 1 !== 0)
        throw new Error(`Requested i32 encode for non integer value ${val}`);
    // LEB128 encoding from
    // https://gitlab.com/mjbecze/leb128/-/blob/master/signed.js
    const result = [];
    let more = true;
    while (more) {
        let byte_ = val & 0x7f;
        val >>= 7;
        // if val is negative then fill the rest with 1s, else with 0s
        if (val === 0 && (byte_ & 0x40) === 0 || val === -1 && (byte_ & 0x40) !== 0) {
            more = false;
        }
        else {
            byte_ |= 0x80;
        }
        result.push(byte_);
    }
    return result;
}
exports.EncodeI32 = EncodeI32;
function EncodeU32(val) {
    if (val % 1 !== 0)
        throw new Error(`Requested u32 encode for non integer value ${val}`);
    if (val < 0)
        throw new Error(`Requested u32 encode for signed integer value ${val}`);
    // LEB128 encoding: https://en.wikipedia.org/wiki/LEB128#Encode_signed_32-bit_integer
    val |= 0;
    const result = [];
    while (true) {
        const byte_ = val & 0x7f;
        val >>= 7;
        if ((val === 0 && (byte_ & 0x40) === 0) ||
            (val === -1 && (byte_ & 0x40) !== 0)) {
            result.push(byte_);
            return result;
        }
        result.push(byte_ | 0x80);
    }
}
exports.EncodeU32 = EncodeU32;
