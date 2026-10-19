var DB_PATH, plain, run

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "../test/fixtures/build.js"

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2F0LnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdF9vbGQvY2F0LnRlc3Qua29kZSJdLCJtYXBwaW5ncyI6Ijs7T0FRTyxLQUFLLEtBQUs7T0FDVixPQUFPLEtBQUs7Ozs7Ozs7OztBQU9uQixVQUFVLE1BQU0sV0FBVztBQUUzQixRQUFRLE1BQU0sWUFBWTs7QUFFMUI7Ozs7SUFFSSxXQUFXLEdBQUcsT0FBTztXQUNyQixLQUFLLEdBQUksU0FBVSxTQUFVLElBQUssTUFBQSxNQUFPLE1BQU87O0FBSXBELEtBQUssU0FBUzs7SUFFVixLQUFLOzs7O1FBRUQsUUFBUSxLQUFLLFdBQVcsTUFBTTtRQUU5QixPQUFPLEdBQUcsTUFBTSxHQUFHLFlBQVksV0FBVztRQUMxQyxPQUFPLE1BQU0sTUFBTSxHQUFJO2VBQ3ZCLE9BQU8sTUFBTSxNQUFNLEdBQUk7O0lBRTNCLEtBQUs7Ozs7UUFFRCxNQUFNLEtBQUs7UUFFWCxPQUFPLElBQU8sSUFBSSxTQUFTO2VBQzNCLE9BQU8sSUFBTyxJQUFJLFNBQVM7O0lBRS9CLEtBQUs7Ozs7UUFFRCxNQUFNLEtBQUs7UUFFWCxPQUFPLEdBQUcsSUFBSSxTQUFTO2VBQ3ZCLE9BQU8sSUFBTyxJQUFJLFNBQVM7O1dBRS9CLEtBQUs7O2VBRUQsT0FBTyxJQUFJLEtBQUssV0FBVyxTQUFTOzs7QUFFNUMsS0FBSyxTQUFTOztJQUVWLEtBQUs7Ozs7UUFFRCxNQUFNO1FBRU4sT0FBTyxHQUFHLElBQUksU0FBUztlQUN2QixPQUFPLE1BQU0sSUFBSSxNQUFNLE1BQU07O21CQUFjLE1BQUs7V0FBVSxPQUFROztJQUV0RSxLQUFLOzs7O1FBRUQsTUFBTSxLQUFLO1FBRVgsT0FBTyxJQUFPLElBQUksU0FBUztlQUMzQixPQUFPLEdBQUcsSUFBSSxTQUFTOztJQUUzQixLQUFLOzs7O1FBRUQsTUFBTSxLQUFLLFNBQVU7ZUFFckIsT0FBTyxHQUFHLElBQUksUUFBUSxZQUFZLElBQUksUUFBUTs7SUFFbEQsS0FBSzs7OztRQUVELFFBQVEsS0FBSyxTQUFVLFdBQVcsTUFBTTtRQUN4QyxZQUFZLE1BQU07O21CQUFpQixFQUFFLFlBQVksV0FBVzs7ZUFFNUQsT0FBTyxNQUFNLE1BQU0sWUFBWSxHQUFJOztXQUV2QyxLQUFLOztlQUVELE9BQU8sTUFBTSxLQUFLLFdBQVksS0FBSyxXQUFXLE1BQU0sTUFBTTs7O0FBRWxFLEtBQUssU0FBUzs7SUFFVixLQUFLOztlQUVELE9BQU87O1lBQVUsS0FBSzttQkFBWTs7O1dBRXRDLEtBQUs7Ozs7UUFFRCxNQUFNLEtBQUs7ZUFDWCxPQUFPLElBQU8sSUFBSSxTQUFTIn0=
//# sourceURL=file://kode/test_old/cat.test.kode
