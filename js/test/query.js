var toExport = {}
var A, byId, C, database, DB_PATH, empty, found, ids, insert, message, pairs, rows, second, throwsOcls

import sqlite from 'node:sqlite'
import build from "../test/fixtures/build.js"

import db from "../db.js"

import query from "../query.js"

import helpers from "./helpers.js"
let throws = helpers.throws

DB_PATH = build.fixtures().DB_PATH
database = db.openDb(DB_PATH)

ids = function ()
{
    return query.listSessions(database,[]).map(function (s)
    {
        return s.id
    })
}
A = 'ses_aaaaaaaaaaaaaaaaaaaaaaaaa1'
C = 'ses_ccccccccccccccccccccccc3'

throwsOcls = function (pattern)
{
    var check

    check = function (e)
    {
        return e instanceof db.OclsError && (pattern.test(e.message))
    }
    check.prototype = null
    return check
}
toExport["listSessions filtering"] = function ()
{
    section("returns every top-level session, oldest last message first", function ()
    {
        compare((ids()),['ses_bbbbbbbbbbbbbbbbbbbbbbb2',C,A])
    })
    section("excludes child sessions", function ()
    {
        compare(!ids().includes('ses_ddddddddddddddddddddddd4'),true)
    })
    section("carries the directory the session runs in", function ()
    {
        byId = function (id)
        {
            return query.listSessions(database,[id])[0]
        }
        compare(byId(A).directory,'/home/kodi/a/coco')
        compare(byId('ses_bbbbbbbbbbbbbbbbbbbbbbb2').directory,'/home/kodi/.config')
    })
    section("filters by a 6-character prefix", function ()
    {
        found = query.listSessions(database,['cccccc'])
        compare(found.length,1)
        compare(found[0].id,C)
    })
    section("accepts a prefix with the ses_ prefix included", function ()
    {
        compare(query.listSessions(database,["ses_aaaaaa"]).length,1)
    })
    section("matches several prefixes at once, keeping the query order", function ()
    {
        compare((query.listSessions(database,['ccccccc','aaaaaaa']).map(function (s)
        {
            return s.id
        })),[C,A])
    })
    section("matches a title substring, case insensitive", function ()
    {
        compare((query.listSessions(database,['ocls']).map(function (s)
        {
            return s.id
        })),[A])
        compare((query.listSessions(database,['OCLS']).map(function (s)
        {
            return s.id
        })),[A])
        compare((query.listSessions(database,['Coco']).map(function (s)
        {
            return s.id
        })),[A])
    })
    section("matches anywhere in a title, not only the start", function ()
    {
        compare((query.listSessions(database,['hyprsession']).map(function (s)
        {
            return s.id
        })),[C])
        compare((query.listSessions(database,['hypr']).map(function (s)
        {
            return s.id
        })),[C])
    })
    section("an id still wins over a title", function ()
    {
        compare((query.listSessions(database,['aaaaaaa']).map(function (s)
        {
            return s.id
        })),[A])
    })
    section("ids and titles can be mixed, in the order given", function ()
    {
        compare((query.listSessions(database,['conny','aaaaaaa']).map(function (s)
        {
            return s.id
        })),[C,A])
        compare((query.listSessions(database,['aaaaaaa','conny']).map(function (s)
        {
            return s.id
        })),[A,C])
    })
    section("overlapping title arguments list a session once", function ()
    {
        compare((query.listSessions(database,['ocls','coco']).map(function (s)
        {
            return s.id
        })),[A])
    })
    section("title search never finds a child session", function ()
    {
        throws((function ()
        {
            return query.listSessions(database,['child'])
        }),/no\x20session/i)
    })
    section("an ambiguous id prefix does not fall through to titles", function ()
    {
        throws((function ()
        {
            return query.listSessions(database,['ses_'])
        }),/matches\x20\d+\x20sessions/i)
    })
    section("sql wildcards in an argument stay literal", function ()
    {
        throws((function ()
        {
            return query.listSessions(database,['%'])
        }),/no\x20session/i)
        throws((function ()
        {
            return query.listSessions(database,['_'])
        }),/no\x20session/i)
    })
    section("a term matching nothing is an error", function ()
    {
        throws((function ()
        {
            return query.listSessions(database,['zzzzzz'])
        }),/no\x20session/i)
    })
    section("unknown prefix is an error", function ()
    {
        throws((function ()
        {
            return query.listSessions(database,['zzzzzz'])
        }),throwsOcls(/no\x20session/i))
    })
    section("ambiguous prefix is an error", function ()
    {
        throws((function ()
        {
            return query.listSessions(database,['ses_'])
        }),throwsOcls(/matches\x20\d+\x20sessions/i))
    })
}
toExport["listSessions filtering"]._section_ = true
toExport["listSessions ordering"] = function ()
{
    section("follows the last message, not the update time", function ()
    {
        rows = query.listSessions(database,[])
        pairs = rows.map(function (s)
        {
            return [s.id,s]
        })
        byId = Object.fromEntries(pairs)
        compare(byId[A].time_last > byId[C].time_last,true)
        compare(byId[A].time_updated < byId[C].time_updated,true)
        compare(rows.at(-1).id,A)
    })
    section("a session with no messages sorts on its update time", function ()
    {
        empty = new sqlite.DatabaseSync(':memory:')
        empty.exec(`CREATE TABLE session_v2 (
  id text PRIMARY KEY, parent_id text, title text, directory text,
  time_created integer NOT NULL, time_updated integer NOT NULL
);
CREATE TABLE session_message (
  id text PRIMARY KEY, session_id text NOT NULL, type text NOT NULL,
  seq integer NOT NULL, time_created integer NOT NULL, data text NOT NULL
);`)
        insert = empty.prepare("INSERT INTO session_v2 (id, parent_id, title, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?)")
        insert.run('ses_1111111111111111111111a',null,'Old, touched late','/home/kodi/a/coco',build.BASE,build.BASE + 9 * 3600000)
        insert.run('ses_2222222222222222222222b',null,'New, touched early','/home/kodi/a/coco',build.BASE,build.BASE + 60000)
        message = empty.prepare("INSERT INTO session_message (id, session_id, type, seq, time_created, data) VALUES (?, ?, ?, ?, ?, ?)")
        message.run('m1','ses_2222222222222222222222b','user',1,build.BASE + 5 * 3600000,'{"text":"hi"}')
        compare((query.listSessions(empty,[]).map(function (s)
        {
            return s.id
        })),['ses_2222222222222222222222b','ses_1111111111111111111111a'])
        empty.close()
    })
}
toExport["listSessions ordering"]._section_ = true
toExport["listSessions row data"] = function ()
{
    section("counts turns from user messages with text only", function ()
    {
        pairs = query.listSessions(database,[]).map(function (s)
        {
            return [s.id,s.turns]
        })
        byId = Object.fromEntries(pairs)
        compare(byId[A],2)
        compare(byId['ses_bbbbbbbbbbbbbbbbbbbbbbb2'],0)
        compare(byId[C],1)
    })
    section("null title comes through as null", function ()
    {
        second = query.listSessions(database,['bbbbbb'])[0]
        compare(second.title,null)
        compare(second.time_created,build.BASE + 120000)
        compare(second.time_updated,build.BASE + 180000)
    })
    section("time_last is the time of the newest message", function ()
    {
        pairs = query.listSessions(database,[]).map(function (s)
        {
            return [s.id,s.time_last]
        })
        byId = Object.fromEntries(pairs)
        compare(byId[A],build.BASE + 7 * 1000)
        compare(byId['ses_bbbbbbbbbbbbbbbbbbbbbbb2'],build.BASE + 2 * 1000)
        compare(byId[C],build.BASE + 4 * 1000)
    })
    section("time_last falls back to the update time of a session with no messages", function ()
    {
        empty = new sqlite.DatabaseSync(':memory:')
        empty.exec(`CREATE TABLE session_v2 (
  id text PRIMARY KEY, parent_id text, title text, directory text,
  time_created integer NOT NULL, time_updated integer NOT NULL
);
CREATE TABLE session_message (
  id text PRIMARY KEY, session_id text NOT NULL, type text NOT NULL,
  seq integer NOT NULL, time_created integer NOT NULL, data text NOT NULL
);`)
        insert = empty.prepare("INSERT INTO session_v2 (id, parent_id, title, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?)")
        insert.run('ses_eeeeeeeeeeeeeeeeeeeeeee5',null,'Empty','/home/kodi/a/coco',build.BASE,build.BASE + 42)
        rows = query.listSessions(empty,[])
        compare(rows[0].time_last,build.BASE + 42)
        empty.close()
    })
}
toExport["listSessions row data"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9xdWVyeS5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7T0FXTyxPQUFPLEtBQUs7Ozs7Ozs7Ozs7QUFPbkIsVUFBVSxNQUFNLFdBQVc7QUFFM0IsV0FBVyxHQUFHLE9BQU87O0FBRXJCOztXQUFTLE1BQU0sYUFBYSxhQUFjOztlQUFXLEVBQUU7OztBQUV2RCxJQUFJO0FBQ0osSUFBSTs7QUFPSjs7OztJQUNJOztlQUFlLGFBQWEsR0FBRyxjQUFlLFFBQVEsS0FBSyxFQUFFOztJQUM3RCxNQUFNLFlBQVk7V0FDbEI7Ozs7OztpQkFjSyxRQUNHLCtCQUNBLEVBQ0E7Ozs7aUJBS0EsTUFBTSxTQUFTLGdDQUFrQzs7OztRQUlyRDs7bUJBQWUsTUFBTSxhQUFhLFVBQVcsS0FBSzs7Z0JBRWxELEtBQUssR0FBRyxVQUFZO2dCQUNwQixLQUFLLGdDQUFnQyxVQUFZOzs7O1FBSWpELFFBQVEsTUFBTSxhQUFhLFVBQVc7Z0JBRXRDLE1BQU0sT0FBUztnQkFDZixNQUFNLEdBQUcsR0FBSzs7OztnQkFJZCxNQUFNLGFBQWEsVUFBVyxlQUFlLE9BQVM7Ozs7aUJBSXJELE1BQU0sYUFBYSxVQUFXLFVBQVcsWUFBWTs7bUJBQVcsRUFBRTthQUFRLEVBQUc7Ozs7aUJBSTdFLE1BQU0sYUFBYSxVQUFXLFNBQVM7O21CQUFXLEVBQUU7YUFBUTtpQkFDNUQsTUFBTSxhQUFhLFVBQVcsU0FBUzs7bUJBQVcsRUFBRTthQUFRO2lCQUM1RCxNQUFNLGFBQWEsVUFBVyxTQUFTOzttQkFBVyxFQUFFO2FBQVE7Ozs7aUJBSTVELE1BQU0sYUFBYSxVQUFXLGdCQUFnQjs7bUJBQVcsRUFBRTthQUFRO2lCQUNuRSxNQUFNLGFBQWEsVUFBVyxTQUFTOzttQkFBVyxFQUFFO2FBQVE7Ozs7aUJBSTVELE1BQU0sYUFBYSxVQUFXLFlBQVk7O21CQUFXLEVBQUU7YUFBUTs7OztpQkFJL0QsTUFBTSxhQUFhLFVBQVcsUUFBUyxZQUFZOzttQkFBVyxFQUFFO2FBQVEsRUFBRztpQkFDM0UsTUFBTSxhQUFhLFVBQVcsVUFBVyxVQUFVOzttQkFBVyxFQUFFO2FBQVEsRUFBRzs7OztpQkFJM0UsTUFBTSxhQUFhLFVBQVcsT0FBUSxTQUFTOzttQkFBVyxFQUFFO2FBQVE7Ozs7UUFJckU7O21CQUFXLE1BQU0sYUFBYSxVQUFXO1dBQVk7Ozs7UUFJckQ7O21CQUFXLE1BQU0sYUFBYSxVQUFXO1dBQVc7Ozs7UUFJcEQ7O21CQUFXLE1BQU0sYUFBYSxVQUFXO1dBQVE7UUFDakQ7O21CQUFXLE1BQU0sYUFBYSxVQUFXO1dBQVE7Ozs7UUFJakQ7O21CQUFXLE1BQU0sYUFBYSxVQUFXO1dBQWE7Ozs7UUFJdEQ7O21CQUFXLE1BQU0sYUFBYSxVQUFXO1dBQWEsV0FBVzs7OztRQUlqRTs7bUJBQVcsTUFBTSxhQUFhLFVBQVc7V0FBVyxXQUFXOzs7Ozs7OztRQWMvRCxPQUFPLE1BQU0sYUFBYTtRQUMxQixRQUFRLEtBQUs7O29CQUFZLEVBQUUsR0FBSTs7UUFDL0IsT0FBTyxPQUFPLFlBQVk7Z0JBSTFCLEtBQUssR0FBRyxZQUFZLEtBQUssR0FBRyxVQUFZO2dCQUN4QyxLQUFLLEdBQUcsZUFBZSxLQUFLLEdBQUcsYUFBZTtnQkFDOUMsS0FBSyxHQUFHLElBQUksR0FBSzs7OztRQUlqQixZQUFZLE9BQU8sYUFBYTtRQUVoQyxNQUFNLEtBQUs7Ozs7Ozs7O1FBV1gsU0FBUyxNQUFNLFFBQVE7UUFFdkIsT0FBTyxJQUFJLDhCQUErQixLQUFNLG9CQUFxQixvQkFBcUIsTUFBTSxLQUFNLE1BQU0sT0FBTyxJQUFJO1FBQ3ZILE9BQU8sSUFBSSw4QkFBK0IsS0FBTSxxQkFBc0Isb0JBQXFCLE1BQU0sS0FBTSxNQUFNLE9BQU87UUFFcEgsVUFBVSxNQUFNLFFBQVE7UUFFeEIsUUFBUSxJQUFJLEtBQU0sOEJBQStCLE9BQVEsRUFBRyxNQUFNLE9BQU8sSUFBSSxRQUFTO2lCQUVyRixNQUFNLGFBQWEsVUFBVzs7bUJBQVcsRUFBRTthQUN4Qyw4QkFDQTtRQUdKLE1BQU07Ozs7Ozs7O1FBTU4sUUFBUSxNQUFNLGFBQWEsYUFBYzs7b0JBQVksRUFBRSxHQUFJLEVBQUU7O1FBQzdELE9BQU8sT0FBTyxZQUFZO2dCQUUxQixLQUFLLEdBQUs7Z0JBQ1YsS0FBSyxnQ0FBa0M7Z0JBQ3ZDLEtBQUssR0FBSzs7OztRQUlWLFNBQVMsTUFBTSxhQUFhLFVBQVcsV0FBVztnQkFFbEQsT0FBTyxNQUFRO2dCQUNmLE9BQU8sYUFBZSxNQUFNLE9BQU87Z0JBQ25DLE9BQU8sYUFBZSxNQUFNLE9BQU87Ozs7UUFJbkMsUUFBUSxNQUFNLGFBQWEsYUFBYzs7b0JBQVksRUFBRSxHQUFJLEVBQUU7O1FBQzdELE9BQU8sT0FBTyxZQUFZO2dCQUUxQixLQUFLLEdBQUssTUFBTSxPQUFPLElBQUk7Z0JBQzNCLEtBQUssZ0NBQWtDLE1BQU0sT0FBTyxJQUFJO2dCQUN4RCxLQUFLLEdBQUssTUFBTSxPQUFPLElBQUk7Ozs7UUFJM0IsWUFBWSxPQUFPLGFBQWE7UUFFaEMsTUFBTSxLQUFLOzs7Ozs7OztRQVdYLFNBQVMsTUFBTSxRQUFRO1FBRXZCLE9BQU8sSUFBSSwrQkFBZ0MsS0FBTSxRQUFTLG9CQUFxQixNQUFNLEtBQU0sTUFBTSxPQUFPO1FBRXhHLE9BQU8sTUFBTSxhQUFhO2dCQUUxQixLQUFLLEdBQUcsVUFBWSxNQUFNLE9BQU87UUFFakMsTUFBTSJ9
//# sourceURL=file://kode/test/query.kode
