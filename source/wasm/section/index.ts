import Custom    from "./custom";
import Type      from "./type";
import Import    from "./import";
import Function  from "./function";
import Table     from "./table";
import Memory    from "./memory";
import Global    from "./global";
import Export    from "./export";
import Start     from "./start";
import Element   from "./element";
import Code      from "./code";
import Data      from "./data";
import DataCount from "./data-count";

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