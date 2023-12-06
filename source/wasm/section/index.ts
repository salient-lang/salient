import Custom    from "~/wasm/section/custom.ts";
import Type      from "~/wasm/section/type.ts";
import Import    from "~/wasm/section/import.ts";
import Function  from "~/wasm/section/function.ts";
import Table     from "~/wasm/section/table.ts";
import Memory    from "~/wasm/section/memory.ts";
import Global    from "~/wasm/section/global.ts";
import Export    from "~/wasm/section/export.ts";
import Start     from "~/wasm/section/start.ts";
import Element   from "~/wasm/section/element.ts";
import Code      from "~/wasm/section/code.ts";
import Data      from "~/wasm/section/data.ts";
import DataCount from "~/wasm/section/data-count.ts";

export type Section = Custom | Type | Import | Function | Table | Memory | Global | Export | Start | Element | Code | Data | DataCount ;

export {
	Custom,
	Type,
	Import,
	Function,
	Table,
	Memory,
	Global,
	Export,
	Start,
	Element,
	Code,
	Data,
	DataCount
}