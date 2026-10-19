var toExport = {}
var A, blocks, brief, C, call, database, DB_PATH, fromList, full, names, ofKind, row, texts, truncated, turn, turns

import build from "../test/fixtures/build.js"

import db from "../db.js"

import query from "../query.js"

import helpers from "./helpers.js"
let throws = helpers.throws

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
toExport["getSession order"] = function ()
{
    section("walks messages and parts in order", function ()
    {
        compare((brief(blocks(A))),[['turn','hello'],['turn','hi there'],['call','shell'],['result','total 48\n---\nHyprland 0.56.2'],['turn','done listing'],['turn','again'],['turn','first bit\n\nsecond bit'],['turn','no agent field'],['call','shell'],['call','webfetch'],['result','StatusCode: non 2xx status code (404)'],['call','grep'],['call','read'],['result','name: occ\n']])
    })
    section("consecutive text parts in one message join with a blank line", function ()
    {
        turn = blocks(A).find(function (b)
        {
            return b.text === 'first bit\n\nsecond bit'
        })
        compare(turn.kind,'turn')
    })
}
toExport["getSession order"]._section_ = true
toExport["getSession message types"] = function ()
{
    section("reasoning, synthetic and idle never produce blocks", function ()
    {
        texts = blocks(A).map(function (b)
        {
            var _76_44_

            return ((_76_44_=b.text) != null ? _76_44_ : '')
        }).join('\n')
        compare(!texts.includes('thinking about the greeting'),true)
        compare(!texts.includes('only thinking'),true)
        compare(!texts.includes('system note'),true)
    })
    section("turn blocks carry the role and agent field", function ()
    {
        turns = ofKind(A,'turn')
        compare(turns[0].role,'user')
        compare(turns[0].agent,null)
        compare(turns[1].role,'agent')
        compare(turns[1].agent,'plan')
        compare(turns[4].agent,'build')
        compare(turns[5].agent,null)
    })
    section("call blocks carry the agent of the message they came from", function ()
    {
        compare(ofKind(C,'call')[0].agent,'build')
    })
    section("unknown session id is an error", function ()
    {
        throws((function ()
        {
            return query.getSession(database,'nope')
        }),/no\x20session/i)
    })
    section("the row is the same one listSessions returns", function ()
    {
        fromList = query.listSessions(database,['aaaaaa'])[0]
        row = query.getSession(database,A).row
        compare(row.id,fromList.id)
        compare(row.title,fromList.title)
        compare(row.turns,fromList.turns)
        compare(row.time_created,build.BASE)
    })
}
toExport["getSession message types"]._section_ = true
toExport["getSession tool blocks"] = function ()
{
    section("a call block carries the tool name and its input command", function ()
    {
        call = ofKind(A,'call')[0]
        compare(call.name,'shell')
        compare(call.command,'ls -la; echo ---; hyprctl version')
    })
    section("a tool with empty output produces no result block", function ()
    {
        compare(ofKind(A,'call').length,5)
        compare(ofKind(A,'result').length,3)
    })
    section("an errored tool puts the error message where the result would be", function ()
    {
        texts = ofKind(A,'result').map(function (b)
        {
            return b.text
        })
        compare(texts.includes('StatusCode: non 2xx status code (404)'),true)
    })
    section("a running tool produces no result block", function ()
    {
        names = ofKind(A,'call').map(function (b)
        {
            return b.name
        })
        compare(names.includes('grep'),true)
        compare(ofKind(A,'result').length,3)
    })
    section("every call block carries its tool name", function ()
    {
        compare((ofKind(C,'call').map(function (b)
        {
            return b.name
        })),['shell','shell','shell'])
    })
    section("a nonzero exit produces an exit block naming the tool", function ()
    {
        compare((ofKind(C,'exit')),[{kind:'exit',name:'shell',code:42}])
    })
    section("a zero exit produces no exit block", function ()
    {
        compare(ofKind(A,'exit').length,0)
    })
    section("a truncated result carries its full output path", function ()
    {
        truncated = ofKind(A,'result').find(function (b)
        {
            return b.outputPath
        })
        compare(truncated.outputPath,'/home/kodi/.local/share/opencode/tool-output/tool_abc')
    })
    section("a non-truncated result has no output path", function ()
    {
        full = ofKind(A,'result').find(function (b)
        {
            return b.text.startsWith('total 48')
        })
        compare(full.outputPath,null)
    })
}
toExport["getSession tool blocks"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9tZXNzYWdlcy5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFtQkEsVUFBVSxNQUFNLFdBQVc7QUFFM0IsV0FBVyxHQUFHLE9BQU87QUFFckIsSUFBSTtBQUNKLElBQUk7O0FBRUo7O1dBQWlCLE1BQU0sV0FBVyxTQUFVLElBQUk7OztBQUVoRDs7V0FBa0IsS0FBSzs7WUFBYyxFQUFFLFNBQVE7O29CQUFhLEVBQUUsS0FBTSxFQUFFOzs7O29CQUFZLEVBQUUsS0FBTSxFQUFFOzs7OztBQUU1Rjs7V0FBdUIsT0FBTyxJQUFJOztlQUFjLEVBQUUsU0FBUTs7Ozs7OztpQkFZakQsTUFBTSxPQUFPLE9BQ1QsT0FBUSxVQUNSLE9BQVEsYUFDUixPQUFRLFVBQ1IsU0FBVSxtQ0FDVixPQUFRLGlCQUNSLE9BQVEsVUFDUixPQUFRLDRCQUNSLE9BQVEsbUJBQ1IsT0FBUSxVQUNSLE9BQVEsYUFDUixTQUFVLDBDQUNWLE9BQVEsU0FDUixPQUFRLFNBQ1IsU0FBVTs7OztRQUtmLE9BQU8sT0FBTyxHQUFHOzttQkFBWSxFQUFFLFNBQVE7O2dCQUV2QyxLQUFLLEtBQU87Ozs7Ozs7O1FBWVosUUFBUSxPQUFPLEdBQUc7Ozs7NkJBQVcsRUFBRSwwQkFBTztXQUFJLEtBQUs7aUJBRTNDLE1BQU0sU0FBUywrQkFBZ0M7aUJBQy9DLE1BQU0sU0FBUyxpQkFBa0I7aUJBQ2pDLE1BQU0sU0FBUyxlQUFnQjs7OztRQUluQyxRQUFRLE9BQU8sRUFBRztnQkFFbEIsTUFBTSxHQUFHLEtBQU87Z0JBQ2hCLE1BQU0sR0FBRyxNQUFRO2dCQUNqQixNQUFNLEdBQUcsS0FBTztnQkFDaEIsTUFBTSxHQUFHLE1BQVE7Z0JBQ2pCLE1BQU0sR0FBRyxNQUFRO2dCQUNqQixNQUFNLEdBQUcsTUFBUTs7OztnQkFJakIsT0FBTyxFQUFHLFFBQVEsR0FBRyxNQUFROzs7O1FBSTdCOzttQkFBVyxNQUFNLFdBQVcsU0FBVTtXQUFVOzs7O1FBSWhELFdBQVcsTUFBTSxhQUFhLFVBQVcsV0FBVztRQUNwRCxNQUFNLE1BQU0sV0FBVyxTQUFVLEdBQUc7Z0JBRXBDLElBQUksR0FBSyxTQUFTO2dCQUNsQixJQUFJLE1BQVEsU0FBUztnQkFDckIsSUFBSSxNQUFRLFNBQVM7Z0JBQ3JCLElBQUksYUFBZSxNQUFNOzs7Ozs7OztRQVl6QixPQUFPLE9BQU8sRUFBRyxRQUFRO2dCQUV6QixLQUFLLEtBQU87Z0JBQ1osS0FBSyxRQUFVOzs7O2dCQUlmLE9BQU8sRUFBRyxRQUFRLE9BQVM7Z0JBQzNCLE9BQU8sRUFBRyxVQUFVLE9BQVM7Ozs7UUFJN0IsUUFBUSxPQUFPLEVBQUcsVUFBVTs7bUJBQVcsRUFBRTs7Z0JBRXpDLE1BQU0sU0FBUyx5Q0FBMEM7Ozs7UUFJekQsUUFBUSxPQUFPLEVBQUcsUUFBUTs7bUJBQVcsRUFBRTs7Z0JBRXZDLE1BQU0sU0FBUyxRQUFTO2dCQUN4QixPQUFPLEVBQUcsVUFBVSxPQUFTOzs7O2lCQUk1QixPQUFPLEVBQUcsUUFBUTs7bUJBQVcsRUFBRTthQUFVLFFBQVEsUUFBUTs7OztpQkFJekQsT0FBTyxFQUFHLFdBQWEsS0FBTSxPQUFRLEtBQU0sUUFBUyxLQUFNOzs7O2dCQUkzRCxPQUFPLEVBQUcsUUFBUSxPQUFTOzs7O1FBSTNCLFlBQVksT0FBTyxFQUFHLFVBQVU7O21CQUFZLEVBQUU7O2dCQUU5QyxVQUFVLFdBQWE7Ozs7UUFJdkIsT0FBTyxPQUFPLEVBQUcsVUFBVTs7bUJBQVksRUFBRSxLQUFLLFdBQVc7O2dCQUV6RCxLQUFLLFdBQWEifQ==
//# sourceURL=file://kode/test/messages.kode
