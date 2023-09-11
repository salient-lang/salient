import Custom    from "./custom.ts";
import Type      from "./type.ts";
import Import    from "./import.ts";
import Function  from "./function.ts";
import Table     from "./table.ts";
import Memory    from "./memory.ts";
import Global    from "./global.ts";
import Export    from "./export.ts";
import Start     from "./start.ts";
import Element   from "./element.ts";
import Code      from "./code.ts";
import Data      from "./data.ts";
import DataCount from "./data-count.ts";

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