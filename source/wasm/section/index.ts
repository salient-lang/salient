import Custom    from "./custom.js";
import Type      from "./type.js";
import Import    from "./import.js";
import Function  from "./function.js";
import Table     from "./table.js";
import Memory    from "./memory.js";
import Global    from "./global.js";
import Export    from "./export.js";
import Start     from "./start.js";
import Element   from "./element.js";
import Code      from "./code.js";
import Data      from "./data.js";
import DataCount from "./data-count.js";

type Section = Custom | Type | Import | Function | Table | Memory | Global | Export | Start | Element | Code | Data | DataCount ;

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
	DataCount,

	Section
}