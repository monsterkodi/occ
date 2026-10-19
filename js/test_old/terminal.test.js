var sink

import test from 'node:test'
import assert from 'node:assert/strict'
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
test.describe('createTerminal',function ()
{
    test('writes through to the writer it was given',function ()
    {
        var out

        out = sink()
        terminal(out,false).write('hello')
        return assert.deepEqual(out.chunks,['hello'])
    })
    test('reports interactivity as given',function ()
    {
        assert.equal(terminal(sink(),true).interactive,true)
        return assert.equal(terminal(sink(),false).interactive,false)
    })
    return test('defaults to non-interactive when stdin is not a terminal',function ()
    {
        return assert.equal(terminal(sink()).interactive,false)
    })
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwudGVzdC5qcyIsInNvdXJjZXMiOlsiLi4vLi4va29kZS90ZXN0X29sZC90ZXJtaW5hbC50ZXN0LmtvZGUiXSwibWFwcGluZ3MiOiI7O09BV08sS0FBSyxLQUFLO09BQ1YsT0FBTyxLQUFLOzs7O0FBSW5COzs7O0lBRUk7SUFDQTs7ZUFBa0IsT0FBTyxLQUFLOztZQUU5QixPQUFRLE9BQ1IsTUFBTzs7QUFFWCxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7OztRQUVELE1BQU07UUFDTixTQUFTLElBQUssT0FBTyxNQUFNO2VBRTNCLE9BQU8sVUFBVSxJQUFJLFFBQVM7O0lBRWxDLEtBQUs7O1FBRUQsT0FBTyxNQUFNLFNBQVMsT0FBUSxNQUFNLFlBQWE7ZUFDakQsT0FBTyxNQUFNLFNBQVMsT0FBUSxPQUFPLFlBQWE7O1dBRXRELEtBQUs7O2VBRUQsT0FBTyxNQUFNLFNBQVMsUUFBUSxZQUFhIn0=
//# sourceURL=file://kode/test_old/terminal.test.kode
