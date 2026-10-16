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
            var _78_44_

            return ((_78_44_=b.text) != null ? _78_44_ : '')
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMudGVzdC5qcyIsInNvdXJjZXMiOlsiLi4vLi4va29kZS90ZXN0L21lc3NhZ2VzLnRlc3Qua29kZSJdLCJtYXBwaW5ncyI6Ijs7T0FjTyxLQUFLLEtBQUs7T0FDVixPQUFPLEtBQUs7Ozs7Ozs7QUFNbkIsVUFBVSxNQUFNLFdBQVc7QUFFM0IsV0FBVyxHQUFHLE9BQU87QUFFckIsSUFBSTtBQUNKLElBQUk7O0FBRUo7O1dBQWlCLE1BQU0sV0FBVyxTQUFVLElBQUk7OztBQUVoRDs7V0FBa0IsS0FBSzs7WUFBYyxFQUFFLFNBQVE7O29CQUFhLEVBQUUsS0FBTSxFQUFFOzs7O29CQUFZLEVBQUUsS0FBTSxFQUFFOzs7OztBQUU1Rjs7V0FBdUIsT0FBTyxJQUFJOztlQUFjLEVBQUUsU0FBUTs7O0FBUTFELEtBQUssU0FBUzs7SUFFVixLQUFLOztlQUVELE9BQU8sVUFBVSxNQUFNLE9BQU8sTUFDekIsT0FBUSxVQUNSLE9BQVEsYUFDUixPQUFRLFVBQ1IsU0FBVSxtQ0FDVixPQUFRLGlCQUNSLE9BQVEsVUFDUixPQUFRLDRCQUNSLE9BQVEsbUJBQ1IsT0FBUSxVQUNSLE9BQVEsYUFDUixTQUFVLDBDQUNWLE9BQVEsU0FDUixPQUFRLFNBQ1IsU0FBVTs7V0FHbkIsS0FBSzs7OztRQUVELE9BQU8sT0FBTyxHQUFHOzttQkFBWSxFQUFFLFNBQVE7O2VBRXZDLE9BQU8sTUFBTSxLQUFLLEtBQU07OztBQVFoQyxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7OztRQUVELFFBQVEsT0FBTyxHQUFHOzs7OzZCQUFXLEVBQUUsMEJBQU87V0FBSSxLQUFLO1FBRS9DLE9BQU8sSUFBTyxNQUFNLFNBQVM7UUFDN0IsT0FBTyxJQUFPLE1BQU0sU0FBUztlQUM3QixPQUFPLElBQU8sTUFBTSxTQUFTOztJQUVqQyxLQUFLOzs7O1FBRUQsUUFBUSxPQUFPLEVBQUc7UUFFbEIsT0FBTyxNQUFNLE1BQU0sR0FBRyxLQUFNO1FBQzVCLE9BQU8sTUFBTSxNQUFNLEdBQUcsTUFBTztRQUM3QixPQUFPLE1BQU0sTUFBTSxHQUFHLEtBQU07UUFDNUIsT0FBTyxNQUFNLE1BQU0sR0FBRyxNQUFPO1FBQzdCLE9BQU8sTUFBTSxNQUFNLEdBQUcsTUFBTztlQUM3QixPQUFPLE1BQU0sTUFBTSxHQUFHLE1BQU87O0lBRWpDLEtBQUs7O2VBRUQsT0FBTyxNQUFNLE9BQU8sRUFBRyxRQUFRLEdBQUcsTUFBTzs7SUFFN0MsS0FBSzs7ZUFFRCxPQUFPOztZQUFVLE1BQU0sV0FBVyxTQUFVO21CQUFTOzs7V0FFekQsS0FBSzs7OztRQUVELFdBQVcsTUFBTSxhQUFhLFVBQVcsV0FBVztRQUNwRCxNQUFNLE1BQU0sV0FBVyxTQUFVLEdBQUc7UUFFcEMsT0FBTyxNQUFNLElBQUksR0FBSSxTQUFTO1FBQzlCLE9BQU8sTUFBTSxJQUFJLE1BQU8sU0FBUztRQUNqQyxPQUFPLE1BQU0sSUFBSSxNQUFPLFNBQVM7ZUFDakMsT0FBTyxNQUFNLElBQUksYUFBYyxNQUFNOzs7QUFRN0MsS0FBSyxTQUFTOztJQUVWLEtBQUs7Ozs7UUFFRCxPQUFPLE9BQU8sRUFBRyxRQUFRO1FBRXpCLE9BQU8sTUFBTSxLQUFLLEtBQU07ZUFDeEIsT0FBTyxNQUFNLEtBQUssUUFBUzs7SUFFL0IsS0FBSzs7UUFFRCxPQUFPLE1BQU0sT0FBTyxFQUFHLFFBQVEsT0FBUTtlQUN2QyxPQUFPLE1BQU0sT0FBTyxFQUFHLFVBQVUsT0FBUTs7SUFFN0MsS0FBSzs7OztRQUVELFFBQVEsT0FBTyxFQUFHLFVBQVU7O21CQUFXLEVBQUU7O2VBRXpDLE9BQU8sR0FBRyxNQUFNLFNBQVM7O0lBRTdCLEtBQUs7Ozs7UUFFRCxRQUFRLE9BQU8sRUFBRyxRQUFROzttQkFBVyxFQUFFOztRQUV2QyxPQUFPLEdBQUcsTUFBTSxTQUFTO2VBQ3pCLE9BQU8sTUFBTSxPQUFPLEVBQUcsVUFBVSxPQUFROztJQUU3QyxLQUFLOztlQUVELE9BQU8sVUFBVSxPQUFPLEVBQUcsUUFBUTs7bUJBQVcsRUFBRTtZQUFRLFFBQVEsUUFBUTs7SUFFNUUsS0FBSzs7ZUFFRCxPQUFPLFVBQVUsT0FBTyxFQUFHLFVBQVcsS0FBTSxPQUFRLEtBQU0sUUFBUyxLQUFNOztJQUU3RSxLQUFLOztlQUVELE9BQU8sTUFBTSxPQUFPLEVBQUcsUUFBUSxPQUFROztJQUUzQyxLQUFLOzs7O1FBRUQsWUFBWSxPQUFPLEVBQUcsVUFBVTs7bUJBQVksRUFBRTs7ZUFFOUMsT0FBTyxNQUFNLFVBQVUsV0FBWTs7V0FFdkMsS0FBSzs7OztRQUVELE9BQU8sT0FBTyxFQUFHLFVBQVU7O21CQUFZLEVBQUUsS0FBSyxXQUFXOztlQUV6RCxPQUFPLE1BQU0sS0FBSyxXQUFZIn0=
//# sourceURL=file://kode/test/messages.test.kode
