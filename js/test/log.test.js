var DB_PATH, history, markers, plain, run

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "./fixtures/build.js"

import db from "../db.js"

import log from "../log.js"

import style from "../style.js"

history = log
DB_PATH = build.fixtures().DB_PATH
plain = style.createStyle(false)

run = function (ids, width = 80)
{
    var database

    database = db.openDb(DB_PATH)
    return history({db:database,prefixes:ids,width:width,style:plain})
}

markers = function (out)
{
    return out.split('\n').filter(function (l)
    {
        return l.startsWith('>') || l.startsWith('$')
    })
}
test.describe('log blocks',function ()
{
    test('starts with the session row, then the blocks',function ()
    {
        var lines

        lines = run(['aaaaaa']).split('\n')
        assert.ok(lines[0].trimStart().startsWith('aaaaaa '))
        assert.equal(lines[1],'> user')
        return assert.equal(lines[2],'hello')
    })
    test('shows tool calls and results inline, in order',function ()
    {
        return assert.deepEqual(markers(run(['aaaaaa'])),['> user','> agent plan','$ shell','$ shell result','> user','> agent build','$ shell','$ webfetch','$ webfetch result','$ grep','$ read','$ read result'])
    })
    test('an assistant message with no agent field continues the run',function ()
    {
        var lines

        lines = run(['aaaaaa']).split('\n')
        return assert.equal(lines[lines.indexOf('no agent field') - 1],'…')
    })
    return test('agent text after a tool call continues with an ellipsis',function ()
    {
        var cont, lines

        lines = run(['aaaaaa']).split('\n')
        cont = lines.indexOf('…',lines.indexOf,'$ shell result')
        assert.ok(cont > lines.indexOf('$ shell result'))
        return assert.equal(lines[cont + 1],'done listing')
    })
})
test.describe('log selection',function ()
{
    test('shows every session when no ids are given',function ()
    {
        var every

        every = run([])
        assert.ok(every.includes,'$ webfetch')
        return assert.ok(every.includes,'$ shell')
    })
    test('ids filter which sessions are shown',function ()
    {
        return assert.ok(!run(['cccccc']).includes('$ webfetch'))
    })
    test('ids keep the order they were given in',function ()
    {
        var out

        out = run(['bbbbbb','aaaaaa'])
        return assert.ok(out.indexOf('bbbbbb') < out.indexOf('aaaaaa'))
    })
    test('sessions are separated by a blank line',function ()
    {
        var lines, secondRow

        lines = run(['aaaaaa','cccccc']).split('\n')
        secondRow = lines.findIndex(function (l)
        {
            return l.trimStart().startsWith('cccccc ')
        })
        return assert.equal(lines[secondRow - 1],'')
    })
    return test('a session with no renderable blocks prints only its row',function ()
    {
        return assert.equal(run(['bbbbbb']),run(['bbbbbb']).split('\n')[0])
    })
})
test.describe('log errors',function ()
{
    test('unknown id surfaces the error',function ()
    {
        return assert.throws(function ()
        {
            run(['zzzzzz'])
            return /no\x20session/i
        })
    })
    return test('output ends without a trailing blank line',function ()
    {
        var out

        out = run(['aaaaaa'])
        return assert.ok(!out.endsWith('\n'))
    })
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9sb2cudGVzdC5rb2RlIl0sIm1hcHBpbmdzIjoiOztPQVFPLEtBQUssS0FBSztPQUNWLE9BQU8sS0FBSzs7Ozs7Ozs7O0FBVW5CLFVBQVU7QUFFVixVQUFVLE1BQU0sV0FBVztBQUUzQixRQUFRLE1BQU0sWUFBWTs7QUFFMUI7Ozs7SUFFSSxXQUFXLEdBQUcsT0FBTztXQUNyQixTQUFTLEdBQUksU0FBVSxTQUFVLElBQUssTUFBQSxNQUFPLE1BQU87OztBQUV4RDs7V0FBbUIsSUFBSSxNQUFNLE1BQU07O2VBQWMsRUFBRSxXQUFXLFFBQVEsRUFBRSxXQUFXOzs7QUFRbkYsS0FBSyxTQUFTOztJQUVWLEtBQUs7Ozs7UUFFRCxRQUFRLEtBQUssV0FBVyxNQUFNO1FBRTlCLE9BQU8sR0FBRyxNQUFNLEdBQUcsWUFBWSxXQUFXO1FBQzFDLE9BQU8sTUFBTSxNQUFNLEdBQUk7ZUFDdkIsT0FBTyxNQUFNLE1BQU0sR0FBSTs7SUFFM0IsS0FBSzs7ZUFFRCxPQUFPLFVBQVUsUUFBUSxLQUFLLGFBQzFCLFNBQ0EsZUFDQSxVQUNBLGlCQUNBLFNBQ0EsZ0JBQ0EsVUFDQSxhQUNBLG9CQUNBLFNBQ0EsU0FDQTs7SUFHUixLQUFLOzs7O1FBRUQsUUFBUSxLQUFLLFdBQVcsTUFBTTtlQUM5QixPQUFPLE1BQU0sTUFBTSxNQUFNLFFBQVEsb0JBQW9CLEdBQUk7O1dBRTdELEtBQUs7Ozs7UUFFRCxRQUFRLEtBQUssV0FBVyxNQUFNO1FBQzlCLE9BQU8sTUFBTSxRQUFRLElBQUssTUFBTSxRQUFRO1FBRXhDLE9BQU8sR0FBRyxPQUFPLE1BQU0sUUFBUTtlQUMvQixPQUFPLE1BQU0sTUFBTSxPQUFPLEdBQUk7OztBQVF0QyxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7OztRQUVELFFBQVE7UUFDUixPQUFPLEdBQUcsTUFBTSxTQUFTO2VBQ3pCLE9BQU8sR0FBRyxNQUFNLFNBQVM7O0lBRTdCLEtBQUs7O2VBRUQsT0FBTyxJQUFPLEtBQUssV0FBVyxTQUFTOztJQUUzQyxLQUFLOzs7O1FBRUQsTUFBTSxLQUFLLFNBQVU7ZUFDckIsT0FBTyxHQUFHLElBQUksUUFBUSxZQUFZLElBQUksUUFBUTs7SUFFbEQsS0FBSzs7OztRQUVELFFBQVEsS0FBSyxTQUFVLFdBQVcsTUFBTTtRQUN4QyxZQUFZLE1BQU07O21CQUFpQixFQUFFLFlBQVksV0FBVzs7ZUFFNUQsT0FBTyxNQUFNLE1BQU0sWUFBWSxHQUFJOztXQUV2QyxLQUFLOztlQUVELE9BQU8sTUFBTSxLQUFLLFdBQVksS0FBSyxXQUFXLE1BQU0sTUFBTTs7O0FBUWxFLEtBQUssU0FBUzs7SUFFVixLQUFLOztlQUVELE9BQU87O1lBQVUsS0FBSzttQkFBWTs7O1dBRXRDLEtBQUs7Ozs7UUFFRCxNQUFNLEtBQUs7ZUFDWCxPQUFPLElBQU8sSUFBSSxTQUFTIn0=
//# sourceURL=file://kode/test/log.test.kode
