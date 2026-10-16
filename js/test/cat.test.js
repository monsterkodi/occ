var DB_PATH, plain, run

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "./fixtures/build.js"

import db from "../db.js"

import cat from "../cat.js"

import style from "../style.js"

DB_PATH = build.fixtures().DB_PATH
plain = style.createStyle(false)

run = function (ids, width = 80)
{
    var database

    database = db.openDb(DB_PATH)
    return cat({db:database,prefixes:ids,width:width,style:plain})
}
test.describe('cat',function ()
{
    test('starts with the session row, then the turns',function ()
    {
        var lines

        lines = run(['aaaaaa']).split('\n')
        assert.ok(lines[0].trimStart().startsWith('aaaaaa '))
        assert.equal(lines[1],'> user')
        return assert.equal(lines[2],'hello')
    })
    test('shows no tool calls or results at all',function ()
    {
        var out

        out = run(['aaaaaa'])
        assert.ok(!out.includes('$ '))
        return assert.ok(!out.includes('hyprctl'))
    })
    test('text on both sides of a tool call joins into one turn',function ()
    {
        var out

        out = run(['aaaaaa'])
        assert.ok(out.includes,"hi there\n\ndone listing")
        return assert.ok(!out.includes('total 48'))
    })
    return test('consecutive text parts in one message still join with a blank line',function ()
    {
        return assert.ok((run,['aaaaaa']).includes,"first bit\n\nsecond bit")
    })
})
test.describe('cat selection',function ()
{
    test('shows every session when no ids are given',function ()
    {
        var out

        out = run([])
        assert.ok(out.includes,'> user')
        return assert.equal(out.split('\n').filter(function (l)
        {
            return l === '> user'
        }).length,3)
    })
    test('ids filter which sessions are shown',function ()
    {
        var out

        out = run(['cccccc'])
        assert.ok(!out.includes('hello'))
        return assert.ok(out.includes,'> user')
    })
    test('ids keep the order they were given in',function ()
    {
        var out

        out = run(['bbbbbb','aaaaaa'])
        return assert.ok(out.indexOf('bbbbbb') < out.indexOf('aaaaaa'))
    })
    test('sessions are separated by a blank line, not a rule',function ()
    {
        var lines, secondRow

        lines = run(['aaaaaa','cccccc']).split('\n')
        secondRow = lines.findIndex(function (l)
        {
            return l.trimStart().startsWith('cccccc ')
        })
        return assert.equal(lines[secondRow - 1],'')
    })
    return test('a session with no renderable turns prints only its row',function ()
    {
        return assert.equal(run(['bbbbbb']),run(['bbbbbb']).split('\n')[0])
    })
})
test.describe('cat errors',function ()
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2F0LnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9jYXQudGVzdC5rb2RlIl0sIm1hcHBpbmdzIjoiOztPQVFPLEtBQUssS0FBSztPQUNWLE9BQU8sS0FBSzs7Ozs7Ozs7O0FBT25CLFVBQVUsTUFBTSxXQUFXO0FBRTNCLFFBQVEsTUFBTSxZQUFZOztBQUUxQjs7OztJQUVJLFdBQVcsR0FBRyxPQUFPO1dBQ3JCLEtBQUssR0FBSSxTQUFVLFNBQVUsSUFBSyxNQUFBLE1BQU8sTUFBTzs7QUFJcEQsS0FBSyxTQUFTOztJQUVWLEtBQUs7Ozs7UUFFRCxRQUFRLEtBQUssV0FBVyxNQUFNO1FBRTlCLE9BQU8sR0FBRyxNQUFNLEdBQUcsWUFBWSxXQUFXO1FBQzFDLE9BQU8sTUFBTSxNQUFNLEdBQUk7ZUFDdkIsT0FBTyxNQUFNLE1BQU0sR0FBSTs7SUFFM0IsS0FBSzs7OztRQUVELE1BQU0sS0FBSztRQUVYLE9BQU8sSUFBTyxJQUFJLFNBQVM7ZUFDM0IsT0FBTyxJQUFPLElBQUksU0FBUzs7SUFFL0IsS0FBSzs7OztRQUVELE1BQU0sS0FBSztRQUVYLE9BQU8sR0FBRyxJQUFJLFNBQVM7ZUFDdkIsT0FBTyxJQUFPLElBQUksU0FBUzs7V0FFL0IsS0FBSzs7ZUFFRCxPQUFPLElBQUksS0FBSyxXQUFXLFNBQVM7OztBQUU1QyxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7OztRQUVELE1BQU07UUFFTixPQUFPLEdBQUcsSUFBSSxTQUFTO2VBQ3ZCLE9BQU8sTUFBTSxJQUFJLE1BQU0sTUFBTTs7bUJBQWMsTUFBSztXQUFVLE9BQVE7O0lBRXRFLEtBQUs7Ozs7UUFFRCxNQUFNLEtBQUs7UUFFWCxPQUFPLElBQU8sSUFBSSxTQUFTO2VBQzNCLE9BQU8sR0FBRyxJQUFJLFNBQVM7O0lBRTNCLEtBQUs7Ozs7UUFFRCxNQUFNLEtBQUssU0FBVTtlQUVyQixPQUFPLEdBQUcsSUFBSSxRQUFRLFlBQVksSUFBSSxRQUFROztJQUVsRCxLQUFLOzs7O1FBRUQsUUFBUSxLQUFLLFNBQVUsV0FBVyxNQUFNO1FBQ3hDLFlBQVksTUFBTTs7bUJBQWlCLEVBQUUsWUFBWSxXQUFXOztlQUU1RCxPQUFPLE1BQU0sTUFBTSxZQUFZLEdBQUk7O1dBRXZDLEtBQUs7O2VBRUQsT0FBTyxNQUFNLEtBQUssV0FBWSxLQUFLLFdBQVcsTUFBTSxNQUFNOzs7QUFFbEUsS0FBSyxTQUFTOztJQUVWLEtBQUs7O2VBRUQsT0FBTzs7WUFBVSxLQUFLO21CQUFZOzs7V0FFdEMsS0FBSzs7OztRQUVELE1BQU0sS0FBSztlQUNYLE9BQU8sSUFBTyxJQUFJLFNBQVMifQ==
//# sourceURL=file://kode/test/cat.test.kode
