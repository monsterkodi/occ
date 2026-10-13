var A, blocks, brief, C, database, DB_PATH, ofKind

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "./fixtures/build.js"

import db from "../db.js"

import query from "../query.js"

DB_PATH = build.fixtures().DB_PATH
database = db.openDb(DB_PATH)
A = 'ses_aaaaaaaaaaaaaaaaaaaaaaaaa1'
C = 'ses_ccccccccccccccccccccccc3'

blocks = function (id)
{
    return query.getSession(database,id).blocks
}

brief = function (rows)
{
    return rows.map(function (b)
    {
        if (b.kind === 'call')
        {
            return [b.kind,b.name]
        }
        else
        {
            return [b.kind,b.text]
        }
    })
}

ofKind = function (id, kind)
{
    return blocks(id).filter(function (b)
    {
        return b.kind === kind
    })
}
test.describe('getSession order',function ()
{
    test('walks messages and parts in order',function ()
    {
        return assert.deepEqual(brief(blocks(A)),[['turn','hello'],['turn','hi there'],['call','shell'],['result','total 48\n---\nHyprland 0.56.2'],['turn','done listing'],['turn','again'],['turn','first bit\n\nsecond bit'],['turn','no agent field'],['call','shell'],['call','webfetch'],['result','StatusCode: non 2xx status code (404)'],['call','grep'],['call','read'],['result','name: occ\n']])
    })
    return test('consecutive text parts in one message join with a blank line',function ()
    {
        var turn

        turn = blocks(A).find(function (b)
        {
            return b.text === 'first bit\n\nsecond bit'
        })
        return assert.equal(turn.kind,'turn')
    })
})
test.describe('getSession message types',function ()
{
    test('reasoning, synthetic and idle never produce blocks',function ()
    {
        var texts

        texts = blocks(A).map(function (b)
        {
            var _82_44_

            return ((_82_44_=b.text) != null ? _82_44_ : '')
        }).join('\n')
        assert.ok(!texts.includes('thinking about the greeting'))
        assert.ok(!texts.includes('only thinking'))
        return assert.ok(!texts.includes('system note'))
    })
    test('turn blocks carry the role and agent field',function ()
    {
        var turns

        turns = ofKind(A,'turn')
        assert.equal(turns[0].role,'user')
        assert.equal(turns[0].agent,null)
        assert.equal(turns[1].role,'agent')
        assert.equal(turns[1].agent,'plan')
        assert.equal(turns[4].agent,'build')
        return assert.equal(turns[5].agent,null)
    })
    test('call blocks carry the agent of the message they came from',function ()
    {
        return assert.equal(ofKind(C,'call')[0].agent,'build')
    })
    test('unknown session id is an error',function ()
    {
        return assert.throws(function ()
        {
            query.getSession(database,'nope')
            return /no\x20session/i
        })
    })
    return test('the row is the same one listSessions returns',function ()
    {
        var fromList, row

        fromList = query.listSessions(database,['aaaaaa'])[0]
        row = query.getSession(database,A).row
        assert.equal(row.id,fromList.id)
        assert.equal(row.title,fromList.title)
        assert.equal(row.turns,fromList.turns)
        return assert.equal(row.time_created,build.BASE)
    })
})
test.describe('getSession tool blocks',function ()
{
    test('a call block carries the tool name and its input command',function ()
    {
        var call

        call = ofKind(A,'call')[0]
        assert.equal(call.name,'shell')
        return assert.equal(call.command,'ls -la; echo ---; hyprctl version')
    })
    test('a tool with empty output produces no result block',function ()
    {
        assert.equal(ofKind(A,'call').length,5)
        return assert.equal(ofKind(A,'result').length,3)
    })
    test('an errored tool puts the error message where the result would be',function ()
    {
        var texts

        texts = ofKind(A,'result').map(function (b)
        {
            return b.text
        })
        return assert.ok(texts.includes,'StatusCode: non 2xx status code (404)')
    })
    test('a running tool produces no result block',function ()
    {
        var names

        names = ofKind(A,'call').map(function (b)
        {
            return b.name
        })
        assert.ok(names.includes,'grep')
        return assert.equal(ofKind(A,'result').length,3)
    })
    test('every call block carries its tool name',function ()
    {
        return assert.deepEqual(ofKind(C,'call').map(function (b)
        {
            return b.name
        }),['shell','shell','shell'])
    })
    test('a nonzero exit produces an exit block naming the tool',function ()
    {
        return assert.deepEqual(ofKind(C,'exit'),[{kind:'exit',name:'shell',code:42}])
    })
    test('a zero exit produces no exit block',function ()
    {
        return assert.equal(ofKind(A,'exit').length,0)
    })
    test('a truncated result carries its full output path',function ()
    {
        var truncated

        truncated = ofKind(A,'result').find(function (b)
        {
            return b.outputPath
        })
        return assert.equal(truncated.outputPath,'/home/kodi/.local/share/opencode/tool-output/tool_abc')
    })
    return test('a non-truncated result has no output path',function ()
    {
        var full

        full = ofKind(A,'result').find(function (b)
        {
            return b.text.startsWith('total 48')
        })
        return assert.equal(full.outputPath,null)
    })
})