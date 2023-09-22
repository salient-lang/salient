import type { Byte } from "../../helper.ts";
import { EncodeI32, EncodeU32 } from "../type.ts";


const textEncoder = new TextEncoder();

class Entry {
	offset: number;
	data: BufferSource;

	constructor(offset: number, data: BufferSource) {
		this.offset  = offset;
		this.data    = data;
	}
}

export default class DataSection {
	entries: Entry[];

	constructor() {
		this.entries = [];
	}

	setData(offset: number, data: string | BufferSource) {
		if (typeof(data) === "string") {
			data = textEncoder.encode(data);
		}

		this.entries.push(new Entry(
			offset,
			data
		));

		return 0;
	}

	toBinary (): Byte[] {
		const buf: Byte[] = [
			...EncodeU32(this.entries.length)
		];

		for (const entry of this.entries) {
			buf.push(...EncodeU32(0));

			// i32 const expr
			buf.push(0x41);
			buf.push(...EncodeI32(entry.offset));
			buf.push(0x0b);

			const raw = entry.data instanceof ArrayBuffer
				? Array.from( new Uint8Array(entry.data) )
				: new Uint8Array(entry.data.buffer, entry.data.byteOffset, entry.data.byteLength);

			buf.push(...EncodeU32(raw.length));
			buf.push(...raw);
		}


		return [DataSection.typeID, ...EncodeU32(buf.length), ...buf];
	}

	static typeID = 11;
}