var toExport = {}
var out, sink

import terminal from "../terminal.js"


sink = function ()
{
    var chunks, write

    chunks = []
    write = function (text)
    {
        return chunks.push(text)
    }
    return {chunks:chunks,write:write}
}
toExport["createTerminal"] = function ()
{
    section("writes through to the writer it was given", function ()
    {
        out = sink()
        terminal(out,false).write('hello')
        compare(out.chunks,['hello'])
    })
    section("reports interactivity as given", function ()
    {
        compare(terminal(sink(),true).interactive,true)
        compare(terminal(sink(),false).interactive,false)
        compare(terminal(sink()).interactive,Boolean(process.stdin.isTTY))
    })
}
toExport["createTerminal"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC90ZXJtaW5hbC5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFhQTs7OztJQUVJO0lBQ0E7O2VBQWtCLE9BQU8sS0FBSzs7WUFFOUIsT0FBUSxPQUNSLE1BQU87Ozs7OztRQU1ILE1BQU07UUFDTixTQUFTLElBQUssT0FBTyxNQUFNO2dCQUUzQixJQUFJLFFBQVU7Ozs7Z0JBSWQsU0FBUyxPQUFRLE1BQU0sWUFBZTtnQkFDdEMsU0FBUyxPQUFRLE9BQU8sWUFBYztnQkFFdEMsU0FBUyxRQUFRLFlBQWMsUUFBUSxRQUFRLE1BQU0ifQ==
//# sourceURL=file://kode/test/terminal.kode
