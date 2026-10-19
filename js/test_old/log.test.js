var DB_PATH, history, markers, plain, run

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "../test/fixtures/build.js"

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdF9vbGQvbG9nLnRlc3Qua29kZSJdLCJtYXBwaW5ncyI6Ijs7T0FRTyxLQUFLLEtBQUs7T0FDVixPQUFPLEtBQUs7Ozs7Ozs7OztBQVVuQixVQUFVO0FBRVYsVUFBVSxNQUFNLFdBQVc7QUFFM0IsUUFBUSxNQUFNLFlBQVk7O0FBRTFCOzs7O0lBRUksV0FBVyxHQUFHLE9BQU87V0FDckIsU0FBUyxHQUFJLFNBQVUsU0FBVSxJQUFLLE1BQUEsTUFBTyxNQUFPOzs7QUFFeEQ7O1dBQW1CLElBQUksTUFBTSxNQUFNOztlQUFjLEVBQUUsV0FBVyxRQUFRLEVBQUUsV0FBVzs7O0FBUW5GLEtBQUssU0FBUzs7SUFFVixLQUFLOzs7O1FBRUQsUUFBUSxLQUFLLFdBQVcsTUFBTTtRQUU5QixPQUFPLEdBQUcsTUFBTSxHQUFHLFlBQVksV0FBVztRQUMxQyxPQUFPLE1BQU0sTUFBTSxHQUFJO2VBQ3ZCLE9BQU8sTUFBTSxNQUFNLEdBQUk7O0lBRTNCLEtBQUs7O2VBRUQsT0FBTyxVQUFVLFFBQVEsS0FBSyxhQUMxQixTQUNBLGVBQ0EsVUFDQSxpQkFDQSxTQUNBLGdCQUNBLFVBQ0EsYUFDQSxvQkFDQSxTQUNBLFNBQ0E7O0lBR1IsS0FBSzs7OztRQUVELFFBQVEsS0FBSyxXQUFXLE1BQU07ZUFDOUIsT0FBTyxNQUFNLE1BQU0sTUFBTSxRQUFRLG9CQUFvQixHQUFJOztXQUU3RCxLQUFLOzs7O1FBRUQsUUFBUSxLQUFLLFdBQVcsTUFBTTtRQUM5QixPQUFPLE1BQU0sUUFBUSxJQUFLLE1BQU0sUUFBUTtRQUV4QyxPQUFPLEdBQUcsT0FBTyxNQUFNLFFBQVE7ZUFDL0IsT0FBTyxNQUFNLE1BQU0sT0FBTyxHQUFJOzs7QUFRdEMsS0FBSyxTQUFTOztJQUVWLEtBQUs7Ozs7UUFFRCxRQUFRO1FBQ1IsT0FBTyxHQUFHLE1BQU0sU0FBUztlQUN6QixPQUFPLEdBQUcsTUFBTSxTQUFTOztJQUU3QixLQUFLOztlQUVELE9BQU8sSUFBTyxLQUFLLFdBQVcsU0FBUzs7SUFFM0MsS0FBSzs7OztRQUVELE1BQU0sS0FBSyxTQUFVO2VBQ3JCLE9BQU8sR0FBRyxJQUFJLFFBQVEsWUFBWSxJQUFJLFFBQVE7O0lBRWxELEtBQUs7Ozs7UUFFRCxRQUFRLEtBQUssU0FBVSxXQUFXLE1BQU07UUFDeEMsWUFBWSxNQUFNOzttQkFBaUIsRUFBRSxZQUFZLFdBQVc7O2VBRTVELE9BQU8sTUFBTSxNQUFNLFlBQVksR0FBSTs7V0FFdkMsS0FBSzs7ZUFFRCxPQUFPLE1BQU0sS0FBSyxXQUFZLEtBQUssV0FBVyxNQUFNLE1BQU07OztBQVFsRSxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7ZUFFRCxPQUFPOztZQUFVLEtBQUs7bUJBQVk7OztXQUV0QyxLQUFLOzs7O1FBRUQsTUFBTSxLQUFLO2VBQ1gsT0FBTyxJQUFPLElBQUksU0FBUyJ9
//# sourceURL=file://kode/test_old/log.test.kode
