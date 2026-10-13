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