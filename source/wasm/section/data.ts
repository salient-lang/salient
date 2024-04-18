import { Byte, LatentValue } from "~/helper.ts";
import { EncodeI32, EncodeU32 } from "~/wasm/type.ts";
import { AlignUpInteger } from "~/compiler/helper.ts";


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
	tail: LatentValue<number>;

	constructor() {
		this.entries = [];
		this.tail = new LatentValue();
		this.tail.resolve(0, true);
	}

	addData(data: string | BufferSource, align: number) {
		return this.setData(AlignUpInteger(this.tail.get(), align), data);
	}

	setData(offset: number, data: string | BufferSource) {
		if (typeof(data) === "string") {
			data = textEncoder.encode(data);
		}

		const entry = new Entry(offset, data);
		this.entries.push(entry);

		this.tail.resolve(Math.max(this.tail.get(), AlignUpInteger(offset + data.byteLength, 8)), true);
		return entry;
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