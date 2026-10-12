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