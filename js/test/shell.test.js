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