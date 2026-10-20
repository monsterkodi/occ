var toExport = {}
var A, byId, C, database, DB_PATH, empty, found, ids, insert, message, pairs, rows, second, throwsOcls

import sqlite from 'node:sqlite'
import build from "./fixtures/build.js"

import db from "../db.js"
import query from "../query.js"

import utils from "./utils.js"
let throws = utils.throws

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
toExport["listSessions filtering"] = async function ()
{
    await section("returns every top-level session, oldest last message first", async function ()
    {
        compare((ids()),['ses_bbbbbbbbbbbbbbbbbbbbbbb2',C,A])
    })
    await section("excludes child sessions", async function ()
    {
        compare(!ids().includes('ses_ddddddddddddddddddddddd4'),true)
    })
    await section("carries the directory the session runs in", async function ()
    {
        byId = function (id)
        {
            return query.listSessions(database,[id])[0]
        }
        compare(byId(A).directory,'/home/kodi/a/coco')
        compare(byId('ses_bbbbbbbbbbbbbbbbbbbbbbb2').directory,'/home/kodi/.config')
    })
    await section("filters by a 6-character prefix", async function ()
    {
        found = query.listSessions(database,['cccccc'])
        compare(found.length,1)
        compare(found[0].id,C)
    })
    await section("accepts a prefix with the ses_ prefix included", async function ()
    {
        compare(query.listSessions(database,["ses_aaaaaa"]).length,1)
    })
    await section("matches several prefixes at once, keeping the query order", async function ()
    {
        compare((query.listSessions(database,['ccccccc','aaaaaaa']).map(function (s)
        {
            return s.id
        })),[C,A])
    })
    await section("matches a title substring, case insensitive", async function ()
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
    await section("matches anywhere in a title, not only the start", async function ()
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
    await section("an id still wins over a title", async function ()
    {
        compare((query.listSessions(database,['aaaaaaa']).map(function (s)
        {
            return s.id
        })),[A])
    })
    await section("ids and titles can be mixed, in the order given", async function ()
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
    await section("overlapping title arguments list a session once", async function ()
    {
        compare((query.listSessions(database,['ocls','coco']).map(function (s)
        {
            return s.id
        })),[A])
    })
    await section("title search never finds a child session", async function ()
    {
        throws((function ()
        {
            return query.listSessions(database,['child'])
        }),/no\x20session/i)
    })
    await section("an ambiguous id prefix does not fall through to titles", async function ()
    {
        throws((function ()
        {
            return query.listSessions(database,['ses_'])
        }),/matches\x20\d+\x20sessions/i)
    })
    await section("sql wildcards in an argument stay literal", async function ()
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
    await section("a term matching nothing is an error", async function ()
    {
        throws((function ()
        {
            return query.listSessions(database,['zzzzzz'])
        }),/no\x20session/i)
    })
    await section("unknown prefix is an error", async function ()
    {
        throws((function ()
        {
            return query.listSessions(database,['zzzzzz'])
        }),throwsOcls(/no\x20session/i))
    })
    await section("ambiguous prefix is an error", async function ()
    {
        throws((function ()
        {
            return query.listSessions(database,['ses_'])
        }),throwsOcls(/matches\x20\d+\x20sessions/i))
    })
}
toExport["listSessions filtering"]._section_ = true
toExport["listSessions ordering"] = async function ()
{
    await section("follows the last message, not the update time", async function ()
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
    await section("a session with no messages sorts on its update time", async function ()
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
toExport["listSessions row data"] = async function ()
{
    await section("counts turns from user messages with text only", async function ()
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
    await section("null title comes through as null", async function ()
    {
        second = query.listSessions(database,['bbbbbb'])[0]
        compare(second.title,null)
        compare(second.time_created,build.BASE + 120000)
        compare(second.time_updated,build.BASE + 180000)
    })
    await section("time_last is the time of the newest message", async function ()
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
    await section("time_last falls back to the update time of a session with no messages", async function ()
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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9xdWVyeS5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7T0FXTyxPQUFPLEtBQUs7Ozs7Ozs7OztBQU1uQixVQUFVLE1BQU0sV0FBVztBQUUzQixXQUFXLEdBQUcsT0FBTzs7QUFFckI7O1dBQVMsTUFBTSxhQUFhLGFBQWM7O2VBQVcsRUFBRTs7O0FBRXZELElBQUk7QUFDSixJQUFJOztBQU9KOzs7O0lBQ0k7O2VBQWUsYUFBYSxHQUFHLGNBQWUsUUFBUSxLQUFLLEVBQUU7O0lBQzdELE1BQU0sWUFBWTtXQUNsQjs7Ozs7O2lCQWNLLFFBQ0csK0JBQ0EsRUFDQTs7OztpQkFLQSxNQUFNLFNBQVMsZ0NBQWtDOzs7O1FBSXJEOzttQkFBZSxNQUFNLGFBQWEsVUFBVyxLQUFLOztnQkFFbEQsS0FBSyxHQUFHLFVBQVk7Z0JBQ3BCLEtBQUssZ0NBQWdDLFVBQVk7Ozs7UUFJakQsUUFBUSxNQUFNLGFBQWEsVUFBVztnQkFFdEMsTUFBTSxPQUFTO2dCQUNmLE1BQU0sR0FBRyxHQUFLOzs7O2dCQUlkLE1BQU0sYUFBYSxVQUFXLGVBQWUsT0FBUzs7OztpQkFJckQsTUFBTSxhQUFhLFVBQVcsVUFBVyxZQUFZOzttQkFBVyxFQUFFO2FBQVEsRUFBRzs7OztpQkFJN0UsTUFBTSxhQUFhLFVBQVcsU0FBUzs7bUJBQVcsRUFBRTthQUFRO2lCQUM1RCxNQUFNLGFBQWEsVUFBVyxTQUFTOzttQkFBVyxFQUFFO2FBQVE7aUJBQzVELE1BQU0sYUFBYSxVQUFXLFNBQVM7O21CQUFXLEVBQUU7YUFBUTs7OztpQkFJNUQsTUFBTSxhQUFhLFVBQVcsZ0JBQWdCOzttQkFBVyxFQUFFO2FBQVE7aUJBQ25FLE1BQU0sYUFBYSxVQUFXLFNBQVM7O21CQUFXLEVBQUU7YUFBUTs7OztpQkFJNUQsTUFBTSxhQUFhLFVBQVcsWUFBWTs7bUJBQVcsRUFBRTthQUFROzs7O2lCQUkvRCxNQUFNLGFBQWEsVUFBVyxRQUFTLFlBQVk7O21CQUFXLEVBQUU7YUFBUSxFQUFHO2lCQUMzRSxNQUFNLGFBQWEsVUFBVyxVQUFXLFVBQVU7O21CQUFXLEVBQUU7YUFBUSxFQUFHOzs7O2lCQUkzRSxNQUFNLGFBQWEsVUFBVyxPQUFRLFNBQVM7O21CQUFXLEVBQUU7YUFBUTs7OztRQUlyRTs7bUJBQVcsTUFBTSxhQUFhLFVBQVc7V0FBWTs7OztRQUlyRDs7bUJBQVcsTUFBTSxhQUFhLFVBQVc7V0FBVzs7OztRQUlwRDs7bUJBQVcsTUFBTSxhQUFhLFVBQVc7V0FBUTtRQUNqRDs7bUJBQVcsTUFBTSxhQUFhLFVBQVc7V0FBUTs7OztRQUlqRDs7bUJBQVcsTUFBTSxhQUFhLFVBQVc7V0FBYTs7OztRQUl0RDs7bUJBQVcsTUFBTSxhQUFhLFVBQVc7V0FBYSxXQUFXOzs7O1FBSWpFOzttQkFBVyxNQUFNLGFBQWEsVUFBVztXQUFXLFdBQVc7Ozs7Ozs7O1FBYy9ELE9BQU8sTUFBTSxhQUFhO1FBQzFCLFFBQVEsS0FBSzs7b0JBQVksRUFBRSxHQUFJOztRQUMvQixPQUFPLE9BQU8sWUFBWTtnQkFJMUIsS0FBSyxHQUFHLFlBQVksS0FBSyxHQUFHLFVBQVk7Z0JBQ3hDLEtBQUssR0FBRyxlQUFlLEtBQUssR0FBRyxhQUFlO2dCQUM5QyxLQUFLLEdBQUcsSUFBSSxHQUFLOzs7O1FBSWpCLFlBQVksT0FBTyxhQUFhO1FBRWhDLE1BQU0sS0FBSzs7Ozs7Ozs7UUFXWCxTQUFTLE1BQU0sUUFBUTtRQUV2QixPQUFPLElBQUksOEJBQStCLEtBQU0sb0JBQXFCLG9CQUFxQixNQUFNLEtBQU0sTUFBTSxPQUFPLElBQUk7UUFDdkgsT0FBTyxJQUFJLDhCQUErQixLQUFNLHFCQUFzQixvQkFBcUIsTUFBTSxLQUFNLE1BQU0sT0FBTztRQUVwSCxVQUFVLE1BQU0sUUFBUTtRQUV4QixRQUFRLElBQUksS0FBTSw4QkFBK0IsT0FBUSxFQUFHLE1BQU0sT0FBTyxJQUFJLFFBQVM7aUJBRXJGLE1BQU0sYUFBYSxVQUFXOzttQkFBVyxFQUFFO2FBQ3hDLDhCQUNBO1FBR0osTUFBTTs7Ozs7Ozs7UUFNTixRQUFRLE1BQU0sYUFBYSxhQUFjOztvQkFBWSxFQUFFLEdBQUksRUFBRTs7UUFDN0QsT0FBTyxPQUFPLFlBQVk7Z0JBRTFCLEtBQUssR0FBSztnQkFDVixLQUFLLGdDQUFrQztnQkFDdkMsS0FBSyxHQUFLOzs7O1FBSVYsU0FBUyxNQUFNLGFBQWEsVUFBVyxXQUFXO2dCQUVsRCxPQUFPLE1BQVE7Z0JBQ2YsT0FBTyxhQUFlLE1BQU0sT0FBTztnQkFDbkMsT0FBTyxhQUFlLE1BQU0sT0FBTzs7OztRQUluQyxRQUFRLE1BQU0sYUFBYSxhQUFjOztvQkFBWSxFQUFFLEdBQUksRUFBRTs7UUFDN0QsT0FBTyxPQUFPLFlBQVk7Z0JBRTFCLEtBQUssR0FBSyxNQUFNLE9BQU8sSUFBSTtnQkFDM0IsS0FBSyxnQ0FBa0MsTUFBTSxPQUFPLElBQUk7Z0JBQ3hELEtBQUssR0FBSyxNQUFNLE9BQU8sSUFBSTs7OztRQUkzQixZQUFZLE9BQU8sYUFBYTtRQUVoQyxNQUFNLEtBQUs7Ozs7Ozs7O1FBV1gsU0FBUyxNQUFNLFFBQVE7UUFFdkIsT0FBTyxJQUFJLCtCQUFnQyxLQUFNLFFBQVMsb0JBQXFCLE1BQU0sS0FBTSxNQUFNLE9BQU87UUFFeEcsT0FBTyxNQUFNLGFBQWE7Z0JBRTFCLEtBQUssR0FBRyxVQUFZLE1BQU0sT0FBTztRQUVqQyxNQUFNIn0=
//# sourceURL=file:///home/kodi/s/occ/kode/test/query.kode
