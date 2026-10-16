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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwudGVzdC5qcyIsInNvdXJjZXMiOlsiLi4vLi4va29kZS90ZXN0L3Rlcm1pbmFsLnRlc3Qua29kZSJdLCJtYXBwaW5ncyI6Ijs7T0FXTyxLQUFLLEtBQUs7T0FDVixPQUFPLEtBQUs7Ozs7QUFJbkI7Ozs7SUFFSTtJQUNBOztlQUFrQixPQUFPLEtBQUs7O1lBRTlCLE9BQVEsT0FDUixNQUFPOztBQUVYLEtBQUssU0FBUzs7SUFFVixLQUFLOzs7O1FBRUQsTUFBTTtRQUNOLFNBQVMsSUFBSyxPQUFPLE1BQU07ZUFFM0IsT0FBTyxVQUFVLElBQUksUUFBUzs7SUFFbEMsS0FBSzs7UUFFRCxPQUFPLE1BQU0sU0FBUyxPQUFRLE1BQU0sWUFBYTtlQUNqRCxPQUFPLE1BQU0sU0FBUyxPQUFRLE9BQU8sWUFBYTs7V0FFdEQsS0FBSzs7ZUFFRCxPQUFPLE1BQU0sU0FBUyxRQUFRLFlBQWEifQ==
//# sourceURL=file://kode/test/terminal.test.kode
