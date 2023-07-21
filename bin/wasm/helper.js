"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isByte = void 0;
function isByte(value) {
    return Number.isInteger(value) && value >= 0 && value <= 255;
}
exports.isByte = isByte;
