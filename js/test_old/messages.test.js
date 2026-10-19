var A, blocks, brief, C, database, DB_PATH, ofKind

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "../test/fixtures/build.js"

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMudGVzdC5qcyIsInNvdXJjZXMiOlsiLi4vLi4va29kZS90ZXN0X29sZC9tZXNzYWdlcy50ZXN0LmtvZGUiXSwibWFwcGluZ3MiOiI7O09BY08sS0FBSyxLQUFLO09BQ1YsT0FBTyxLQUFLOzs7Ozs7O0FBTW5CLFVBQVUsTUFBTSxXQUFXO0FBRTNCLFdBQVcsR0FBRyxPQUFPO0FBRXJCLElBQUk7QUFDSixJQUFJOztBQUVKOztXQUFpQixNQUFNLFdBQVcsU0FBVSxJQUFJOzs7QUFFaEQ7O1dBQWtCLEtBQUs7O1lBQWMsRUFBRSxTQUFROztvQkFBYSxFQUFFLEtBQU0sRUFBRTs7OztvQkFBWSxFQUFFLEtBQU0sRUFBRTs7Ozs7QUFFNUY7O1dBQXVCLE9BQU8sSUFBSTs7ZUFBYyxFQUFFLFNBQVE7OztBQVExRCxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7ZUFFRCxPQUFPLFVBQVUsTUFBTSxPQUFPLE1BQ3pCLE9BQVEsVUFDUixPQUFRLGFBQ1IsT0FBUSxVQUNSLFNBQVUsbUNBQ1YsT0FBUSxpQkFDUixPQUFRLFVBQ1IsT0FBUSw0QkFDUixPQUFRLG1CQUNSLE9BQVEsVUFDUixPQUFRLGFBQ1IsU0FBVSwwQ0FDVixPQUFRLFNBQ1IsT0FBUSxTQUNSLFNBQVU7O1dBR25CLEtBQUs7Ozs7UUFFRCxPQUFPLE9BQU8sR0FBRzs7bUJBQVksRUFBRSxTQUFROztlQUV2QyxPQUFPLE1BQU0sS0FBSyxLQUFNOzs7QUFRaEMsS0FBSyxTQUFTOztJQUVWLEtBQUs7Ozs7UUFFRCxRQUFRLE9BQU8sR0FBRzs7Ozs2QkFBVyxFQUFFLDBCQUFPO1dBQUksS0FBSztRQUUvQyxPQUFPLElBQU8sTUFBTSxTQUFTO1FBQzdCLE9BQU8sSUFBTyxNQUFNLFNBQVM7ZUFDN0IsT0FBTyxJQUFPLE1BQU0sU0FBUzs7SUFFakMsS0FBSzs7OztRQUVELFFBQVEsT0FBTyxFQUFHO1FBRWxCLE9BQU8sTUFBTSxNQUFNLEdBQUcsS0FBTTtRQUM1QixPQUFPLE1BQU0sTUFBTSxHQUFHLE1BQU87UUFDN0IsT0FBTyxNQUFNLE1BQU0sR0FBRyxLQUFNO1FBQzVCLE9BQU8sTUFBTSxNQUFNLEdBQUcsTUFBTztRQUM3QixPQUFPLE1BQU0sTUFBTSxHQUFHLE1BQU87ZUFDN0IsT0FBTyxNQUFNLE1BQU0sR0FBRyxNQUFPOztJQUVqQyxLQUFLOztlQUVELE9BQU8sTUFBTSxPQUFPLEVBQUcsUUFBUSxHQUFHLE1BQU87O0lBRTdDLEtBQUs7O2VBRUQsT0FBTzs7WUFBVSxNQUFNLFdBQVcsU0FBVTttQkFBUzs7O1dBRXpELEtBQUs7Ozs7UUFFRCxXQUFXLE1BQU0sYUFBYSxVQUFXLFdBQVc7UUFDcEQsTUFBTSxNQUFNLFdBQVcsU0FBVSxHQUFHO1FBRXBDLE9BQU8sTUFBTSxJQUFJLEdBQUksU0FBUztRQUM5QixPQUFPLE1BQU0sSUFBSSxNQUFPLFNBQVM7UUFDakMsT0FBTyxNQUFNLElBQUksTUFBTyxTQUFTO2VBQ2pDLE9BQU8sTUFBTSxJQUFJLGFBQWMsTUFBTTs7O0FBUTdDLEtBQUssU0FBUzs7SUFFVixLQUFLOzs7O1FBRUQsT0FBTyxPQUFPLEVBQUcsUUFBUTtRQUV6QixPQUFPLE1BQU0sS0FBSyxLQUFNO2VBQ3hCLE9BQU8sTUFBTSxLQUFLLFFBQVM7O0lBRS9CLEtBQUs7O1FBRUQsT0FBTyxNQUFNLE9BQU8sRUFBRyxRQUFRLE9BQVE7ZUFDdkMsT0FBTyxNQUFNLE9BQU8sRUFBRyxVQUFVLE9BQVE7O0lBRTdDLEtBQUs7Ozs7UUFFRCxRQUFRLE9BQU8sRUFBRyxVQUFVOzttQkFBVyxFQUFFOztlQUV6QyxPQUFPLEdBQUcsTUFBTSxTQUFTOztJQUU3QixLQUFLOzs7O1FBRUQsUUFBUSxPQUFPLEVBQUcsUUFBUTs7bUJBQVcsRUFBRTs7UUFFdkMsT0FBTyxHQUFHLE1BQU0sU0FBUztlQUN6QixPQUFPLE1BQU0sT0FBTyxFQUFHLFVBQVUsT0FBUTs7SUFFN0MsS0FBSzs7ZUFFRCxPQUFPLFVBQVUsT0FBTyxFQUFHLFFBQVE7O21CQUFXLEVBQUU7WUFBUSxRQUFRLFFBQVE7O0lBRTVFLEtBQUs7O2VBRUQsT0FBTyxVQUFVLE9BQU8sRUFBRyxVQUFXLEtBQU0sT0FBUSxLQUFNLFFBQVMsS0FBTTs7SUFFN0UsS0FBSzs7ZUFFRCxPQUFPLE1BQU0sT0FBTyxFQUFHLFFBQVEsT0FBUTs7SUFFM0MsS0FBSzs7OztRQUVELFlBQVksT0FBTyxFQUFHLFVBQVU7O21CQUFZLEVBQUU7O2VBRTlDLE9BQU8sTUFBTSxVQUFVLFdBQVk7O1dBRXZDLEtBQUs7Ozs7UUFFRCxPQUFPLE9BQU8sRUFBRyxVQUFVOzttQkFBWSxFQUFFLEtBQUssV0FBVzs7ZUFFekQsT0FBTyxNQUFNLEtBQUssV0FBWSJ9
//# sourceURL=file://kode/test_old/messages.test.kode
