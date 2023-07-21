export type Byte = number;

export function isByte(value: number): value is Byte {
	return Number.isInteger(value) && value >= 0 && value <= 255;
}