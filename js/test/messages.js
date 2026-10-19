var toExport = {}
var A, blocks, brief, C, call, database, DB_PATH, fromList, full, names, ofKind, row, texts, truncated, turn, turns

import build from "./fixtures/build.js"

import db from "../db.js"
import query from "../query.js"

import utils from "./utils.js"
let throws = utils.throws

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
toExport["getSession order"] = async function ()
{
    await section("walks messages and parts in order", async function ()
    {
        compare((brief(blocks(A))),[['turn','hello'],['turn','hi there'],['call','shell'],['result','total 48\n---\nHyprland 0.56.2'],['turn','done listing'],['turn','again'],['turn','first bit\n\nsecond bit'],['turn','no agent field'],['call','shell'],['call','webfetch'],['result','StatusCode: non 2xx status code (404)'],['call','grep'],['call','read'],['result','name: occ\n']])
    })
    await section("consecutive text parts in one message join with a blank line", async function ()
    {
        turn = blocks(A).find(function (b)
        {
            return b.text === 'first bit\n\nsecond bit'
        })
        compare(turn.kind,'turn')
    })
}
toExport["getSession order"]._section_ = true
toExport["getSession message types"] = async function ()
{
    await section("reasoning, synthetic and idle never produce blocks", async function ()
    {
        texts = blocks(A).map(function (b)
        {
            var _75_44_

            return ((_75_44_=b.text) != null ? _75_44_ : '')
        }).join('\n')
        compare(!texts.includes('thinking about the greeting'),true)
        compare(!texts.includes('only thinking'),true)
        compare(!texts.includes('system note'),true)
    })
    await section("turn blocks carry the role and agent field", async function ()
    {
        turns = ofKind(A,'turn')
        compare(turns[0].role,'user')
        compare(turns[0].agent,null)
        compare(turns[1].role,'agent')
        compare(turns[1].agent,'plan')
        compare(turns[4].agent,'build')
        compare(turns[5].agent,null)
    })
    await section("call blocks carry the agent of the message they came from", async function ()
    {
        compare(ofKind(C,'call')[0].agent,'build')
    })
    await section("unknown session id is an error", async function ()
    {
        throws((function ()
        {
            return query.getSession(database,'nope')
        }),/no\x20session/i)
    })
    await section("the row is the same one listSessions returns", async function ()
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
toExport["getSession tool blocks"] = async function ()
{
    await section("a call block carries the tool name and its input command", async function ()
    {
        call = ofKind(A,'call')[0]
        compare(call.name,'shell')
        compare(call.command,'ls -la; echo ---; hyprctl version')
    })
    await section("a tool with empty output produces no result block", async function ()
    {
        compare(ofKind(A,'call').length,5)
        compare(ofKind(A,'result').length,3)
    })
    await section("an errored tool puts the error message where the result would be", async function ()
    {
        texts = ofKind(A,'result').map(function (b)
        {
            return b.text
        })
        compare(texts.includes('StatusCode: non 2xx status code (404)'),true)
    })
    await section("a running tool produces no result block", async function ()
    {
        names = ofKind(A,'call').map(function (b)
        {
            return b.name
        })
        compare(names.includes('grep'),true)
        compare(ofKind(A,'result').length,3)
    })
    await section("every call block carries its tool name", async function ()
    {
        compare((ofKind(C,'call').map(function (b)
        {
            return b.name
        })),['shell','shell','shell'])
    })
    await section("a nonzero exit produces an exit block naming the tool", async function ()
    {
        compare((ofKind(C,'exit')),[{kind:'exit',name:'shell',code:42}])
    })
    await section("a zero exit produces no exit block", async function ()
    {
        compare(ofKind(A,'exit').length,0)
    })
    await section("a truncated result carries its full output path", async function ()
    {
        truncated = ofKind(A,'result').find(function (b)
        {
            return b.outputPath
        })
        compare(truncated.outputPath,'/home/kodi/.local/share/opencode/tool-output/tool_abc')
    })
    await section("a non-truncated result has no output path", async function ()
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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9tZXNzYWdlcy5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWtCQSxVQUFVLE1BQU0sV0FBVztBQUUzQixXQUFXLEdBQUcsT0FBTztBQUVyQixJQUFJO0FBQ0osSUFBSTs7QUFFSjs7V0FBaUIsTUFBTSxXQUFXLFNBQVUsSUFBSTs7O0FBRWhEOztXQUFrQixLQUFLOztZQUFjLEVBQUUsU0FBUTs7b0JBQWEsRUFBRSxLQUFNLEVBQUU7Ozs7b0JBQVksRUFBRSxLQUFNLEVBQUU7Ozs7O0FBRTVGOztXQUF1QixPQUFPLElBQUk7O2VBQWMsRUFBRSxTQUFROzs7Ozs7O2lCQVlqRCxNQUFNLE9BQU8sT0FDVCxPQUFRLFVBQ1IsT0FBUSxhQUNSLE9BQVEsVUFDUixTQUFVLG1DQUNWLE9BQVEsaUJBQ1IsT0FBUSxVQUNSLE9BQVEsNEJBQ1IsT0FBUSxtQkFDUixPQUFRLFVBQ1IsT0FBUSxhQUNSLFNBQVUsMENBQ1YsT0FBUSxTQUNSLE9BQVEsU0FDUixTQUFVOzs7O1FBS2YsT0FBTyxPQUFPLEdBQUc7O21CQUFZLEVBQUUsU0FBUTs7Z0JBRXZDLEtBQUssS0FBTzs7Ozs7Ozs7UUFZWixRQUFRLE9BQU8sR0FBRzs7Ozs2QkFBVyxFQUFFLDBCQUFPO1dBQUksS0FBSztpQkFFM0MsTUFBTSxTQUFTLCtCQUFnQztpQkFDL0MsTUFBTSxTQUFTLGlCQUFrQjtpQkFDakMsTUFBTSxTQUFTLGVBQWdCOzs7O1FBSW5DLFFBQVEsT0FBTyxFQUFHO2dCQUVsQixNQUFNLEdBQUcsS0FBTztnQkFDaEIsTUFBTSxHQUFHLE1BQVE7Z0JBQ2pCLE1BQU0sR0FBRyxLQUFPO2dCQUNoQixNQUFNLEdBQUcsTUFBUTtnQkFDakIsTUFBTSxHQUFHLE1BQVE7Z0JBQ2pCLE1BQU0sR0FBRyxNQUFROzs7O2dCQUlqQixPQUFPLEVBQUcsUUFBUSxHQUFHLE1BQVE7Ozs7UUFJN0I7O21CQUFXLE1BQU0sV0FBVyxTQUFVO1dBQVU7Ozs7UUFJaEQsV0FBVyxNQUFNLGFBQWEsVUFBVyxXQUFXO1FBQ3BELE1BQU0sTUFBTSxXQUFXLFNBQVUsR0FBRztnQkFFcEMsSUFBSSxHQUFLLFNBQVM7Z0JBQ2xCLElBQUksTUFBUSxTQUFTO2dCQUNyQixJQUFJLE1BQVEsU0FBUztnQkFDckIsSUFBSSxhQUFlLE1BQU07Ozs7Ozs7O1FBWXpCLE9BQU8sT0FBTyxFQUFHLFFBQVE7Z0JBRXpCLEtBQUssS0FBTztnQkFDWixLQUFLLFFBQVU7Ozs7Z0JBSWYsT0FBTyxFQUFHLFFBQVEsT0FBUztnQkFDM0IsT0FBTyxFQUFHLFVBQVUsT0FBUzs7OztRQUk3QixRQUFRLE9BQU8sRUFBRyxVQUFVOzttQkFBVyxFQUFFOztnQkFFekMsTUFBTSxTQUFTLHlDQUEwQzs7OztRQUl6RCxRQUFRLE9BQU8sRUFBRyxRQUFROzttQkFBVyxFQUFFOztnQkFFdkMsTUFBTSxTQUFTLFFBQVM7Z0JBQ3hCLE9BQU8sRUFBRyxVQUFVLE9BQVM7Ozs7aUJBSTVCLE9BQU8sRUFBRyxRQUFROzttQkFBVyxFQUFFO2FBQVUsUUFBUSxRQUFROzs7O2lCQUl6RCxPQUFPLEVBQUcsV0FBYSxLQUFNLE9BQVEsS0FBTSxRQUFTLEtBQU07Ozs7Z0JBSTNELE9BQU8sRUFBRyxRQUFRLE9BQVM7Ozs7UUFJM0IsWUFBWSxPQUFPLEVBQUcsVUFBVTs7bUJBQVksRUFBRTs7Z0JBRTlDLFVBQVUsV0FBYTs7OztRQUl2QixPQUFPLE9BQU8sRUFBRyxVQUFVOzttQkFBWSxFQUFFLEtBQUssV0FBVzs7Z0JBRXpELEtBQUssV0FBYSJ9
//# sourceURL=file://kode/test/messages.kode
