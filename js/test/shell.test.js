var DB_PATH, plain, run

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "./fixtures/build.js"

import db from "../db.js"

import shell from "../shell.js"

import style from "../style.js"

DB_PATH = build.fixtures().DB_PATH
plain = style.createStyle(false)

run = function (ids, width = 80)
{
    var database

    database = db.openDb(DB_PATH)
    return shell({db:database,prefixes:ids,width:width,style:plain})
}
test.describe('shell blocks',function ()
{
    test('starts with the session row, then the commands',function ()
    {
        var lines

        lines = run(['cccccc']).split('\n')
        assert.ok(lines[0].trimStart().startsWith('cccccc '))
        return assert.ok(lines.includes,'$ shell')
    })
    test('shows the result of every command, successful or not',function ()
    {
        var out

        out = run(['cccccc'])
        assert.ok(out.includes,"$ shell result\nhi")
        return assert.ok(out.includes,"$ shell result\nboom")
    })
    test('shows an exit marker for a nonzero exit',function ()
    {
        return assert.ok((run,['cccccc']).includes,'$ shell exit 42')
    })
    test('a successful command gets no exit marker',function ()
    {
        return assert.ok(!(run,['cccccc']).includes('$ shell exit 0'))
    })
    return test('shows the agent marker, since it labels whose commands these are',function ()
    {
        return assert.ok((run,['cccccc']).includes,'> agent build')
    })
})
test.describe('shell filtering',function ()
{
    test('shows no user turns and no continuation ellipses',function ()
    {
        var out

        out = run(['cccccc'])
        assert.ok(!out.includes('> user'))
        assert.ok(!out.includes("\n…"))
        return assert.ok(!out.includes('one'))
    })
    test('only shell tools are shown',function ()
    {
        var out

        out = run(['aaaaaa'])
        assert.ok(out.includes,'$ shell')
        assert.ok(!out.includes('$ read'))
        assert.ok(!out.includes('$ webfetch'))
        return assert.ok(!out.includes('$ grep'))
    })
    test('a non-shell tool is never shown even when its name is close',function ()
    {
        return assert.ok(!(run,['cccccc']).includes('$ bash'))
    })
    return test('no ellipsis markers anywhere, since there are no runs to continue',function ()
    {
        var every

        every = run([])
        return assert.ok(!every.includes("\n…"))
    })
})
test.describe('shell selection',function ()
{
    test('shows every session when no ids are given',function ()
    {
        return assert.ok((run,[]).includes,'$ shell')
    })
    test('ids filter which sessions are shown',function ()
    {
        assert.ok(!(run,['cccccc']).includes('hyprctl'))
        return assert.ok((run,['aaaaaa']).includes,'hyprctl')
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
    return test('a session with no shell commands prints only its row',function ()
    {
        return assert.equal(run(['bbbbbb']),run(['bbbbbb']).split('\n')[0])
    })
})
test.describe('shell errors',function ()
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

        out = run(['cccccc'])
        return assert.ok(!out.endsWith('\n'))
    })
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGwudGVzdC5qcyIsInNvdXJjZXMiOlsiLi4vLi4va29kZS90ZXN0L3NoZWxsLnRlc3Qua29kZSJdLCJtYXBwaW5ncyI6Ijs7T0FRTyxLQUFLLEtBQUs7T0FDVixPQUFPLEtBQUs7Ozs7Ozs7OztBQU9uQixVQUFVLE1BQU0sV0FBVztBQUUzQixRQUFRLE1BQU0sWUFBWTs7QUFFMUI7Ozs7SUFFSSxXQUFXLEdBQUcsT0FBTztXQUNyQixPQUFPLEdBQUksU0FBVSxTQUFVLElBQUssTUFBQSxNQUFPLE1BQU87O0FBU3RELEtBQUssU0FBUzs7SUFFVixLQUFLOzs7O1FBRUQsUUFBUSxLQUFLLFdBQVcsTUFBTTtRQUU5QixPQUFPLEdBQUcsTUFBTSxHQUFHLFlBQVksV0FBVztlQUMxQyxPQUFPLEdBQUcsTUFBTSxTQUFTOztJQUU3QixLQUFLOzs7O1FBRUQsTUFBTSxLQUFLO1FBRVgsT0FBTyxHQUFHLElBQUksU0FBUztlQUN2QixPQUFPLEdBQUcsSUFBSSxTQUFTOztJQUUzQixLQUFLOztlQUVELE9BQU8sSUFBSSxLQUFLLFdBQVcsU0FBUzs7SUFFeEMsS0FBSzs7ZUFFRCxPQUFPLEtBQVEsS0FBSyxXQUFXLFNBQVM7O1dBRTVDLEtBQUs7O2VBRUQsT0FBTyxJQUFJLEtBQUssV0FBVyxTQUFTOzs7QUFRNUMsS0FBSyxTQUFTOztJQUVWLEtBQUs7Ozs7UUFFRCxNQUFNLEtBQUs7UUFFWCxPQUFPLElBQU8sSUFBSSxTQUFTO1FBQzNCLE9BQU8sSUFBTyxJQUFJLFNBQVM7ZUFDM0IsT0FBTyxJQUFPLElBQUksU0FBUzs7SUFFL0IsS0FBSzs7OztRQUVELE1BQU0sS0FBSztRQUVYLE9BQU8sR0FBRyxJQUFJLFNBQVM7UUFDdkIsT0FBTyxJQUFPLElBQUksU0FBUztRQUMzQixPQUFPLElBQU8sSUFBSSxTQUFTO2VBQzNCLE9BQU8sSUFBTyxJQUFJLFNBQVM7O0lBRS9CLEtBQUs7O2VBRUQsT0FBTyxLQUFRLEtBQUssV0FBVyxTQUFTOztXQUU1QyxLQUFLOzs7O1FBRUQsUUFBUTtlQUNSLE9BQU8sSUFBTyxNQUFNLFNBQVM7OztBQVFyQyxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7ZUFFRCxPQUFPLElBQUksUUFBUSxTQUFTOztJQUVoQyxLQUFLOztRQUVELE9BQU8sS0FBUSxLQUFLLFdBQVcsU0FBUztlQUN4QyxPQUFPLElBQUksS0FBSyxXQUFXLFNBQVM7O0lBRXhDLEtBQUs7Ozs7UUFFRCxRQUFRLEtBQUssU0FBVSxXQUFXLE1BQU07UUFDeEMsWUFBWSxNQUFNOzttQkFBaUIsRUFBRSxZQUFZLFdBQVc7O2VBRTVELE9BQU8sTUFBTSxNQUFNLFlBQVksR0FBSTs7V0FFdkMsS0FBSzs7ZUFFRCxPQUFPLE1BQU0sS0FBSyxXQUFZLEtBQUssV0FBVyxNQUFNLE1BQU07OztBQVFsRSxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7ZUFFRCxPQUFPOztZQUFVLEtBQUs7bUJBQVk7OztXQUV0QyxLQUFLOzs7O1FBRUQsTUFBTSxLQUFLO2VBQ1gsT0FBTyxJQUFPLElBQUksU0FBUyJ9
//# sourceURL=file://kode/test/shell.test.kode
