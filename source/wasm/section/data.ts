import { Byte } from "../helper";
import { EncodeU32 } from "../type";


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
			buf.push(...EncodeU32(entry.offset));

			if (entry.data instanceof ArrayBuffer) {
				buf.push(...Array.from(
					new Uint8Array(entry.data)
				));
			} else {
				buf.push(...Array.from(
					new Uint8Array(entry.data.buffer, entry.data.byteOffset, entry.data.byteLength)
				));
			}
		}


		return [DataSection.typeID, ...EncodeU32(buf.length), ...buf];
	}

	static typeID = 11;
}