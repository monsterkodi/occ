var toExport = {}
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var at_, checked, created, database, dateOf, dates, daysDb, DB_PATH, every, first, i, line, lines, m, plain, rows, run, runOn, session, sessions, stamp, start, stmt, timeOf, updated

import sqlite from 'node:sqlite'
import build from "./fixtures/build.js"

import db from "../db.js"
import query from "../query.js"
import ls from "../ls.js"
import style from "../style.js"

import utils from "./utils.js"
let throws = utils.throws

DB_PATH = build.fixtures().DB_PATH
plain = style.createStyle(false)

run = function (args, width = 80)
{
    var database

    database = db.openDb(DB_PATH)
    return ls({db:database,prefixes:args,width:width,style:plain})
}

runOn = function (database, args = [], width = 80)
{
    return ls({db:database,prefixes:args,width:width,style:plain})
}

daysDb = function ()
{
    var at, database, id, insert, last, message, row, rows

    database = new sqlite.DatabaseSync(':memory:')
    database.exec(`CREATE TABLE session_v2 (
  id text PRIMARY KEY, parent_id text, title text, directory text,
  time_created integer NOT NULL, time_updated integer NOT NULL
);
CREATE TABLE session_message (
  id text PRIMARY KEY, session_id text NOT NULL, type text NOT NULL,
  seq integer NOT NULL, time_created integer NOT NULL, data text NOT NULL
);`)
    insert = database.prepare("INSERT INTO session_v2 (id, parent_id, title, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?)")
    message = database.prepare("INSERT INTO session_message (id, session_id, type, seq, time_created, data) VALUES (?, ?, ?, ?, ?, ?)")
    at = function (month, date, hours)
    {
        return (new Date(2026,month - 1,date,hours,0,0,0)).getTime()
    }
    rows = [['1111',10,7,11,'same day first'],['2222',10,7,12,'same day second'],['3333',10,11,8,'next day first'],['4444',10,11,14,'next day second'],['5555',10,13,1,'third day']]
    var list = _k_.list(rows)
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        row = list[_a_]
        id = `ses_${row[0]}${'0'.repeat(21)}`
        last = at(row[1],row[2],row[3])
        insert.run(id,null,row[4],'/home/kodi/a/coco',last - 3600000,last)
        message.run(`m_${row[0]}`,id,'user',1,last,JSON.stringify({text:'hi'}))
    }
    return database
}

dateOf = function (line)
{
    var m

    m = (/^\x20\w{6}\x20+(\d\d\.\d\d)/).exec(line)
    if (m === null)
    {
        return undefined
    }
    return m[1]
}

timeOf = function (line)
{
    var m

    m = (/^\x20\w{6}\x20+(?:\d\d\.\d\d)?\x20*(\d\d:\d\d)/).exec(line)
    if (m === null)
    {
        return undefined
    }
    return m[1]
}

at_ = function (line, text)
{
    return line.indexOf(text)
}

stamp = function (ms)
{
    var d, pad

    d = new Date(ms)
    pad = function (n)
    {
        return String(n).padStart(2,'0')
    }
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
toExport["ls date grouping"] = function ()
{
    section("a session repeating the previous row's date shows spaces instead", function ()
    {
        lines = runOn(daysDb()).split('\n')
        compare((dateOf(lines[0])),'07.10')
        compare((dateOf(lines[1])),undefined)
        compare((dateOf(lines[2])),'11.10')
        compare((dateOf(lines[3])),undefined)
        compare((dateOf(lines[4])),'13.10')
    })
    section("the time is still printed on a blanked row", function ()
    {
        lines = runOn(daysDb()).split('\n')
        compare((lines.map(timeOf)),['11:00','12:00','08:00','14:00','01:00'])
    })
    section("every row keeps its full width when the date is blanked", function ()
    {
        var list = _k_.list(runOn(daysDb()).split('\n'))
        for (var _b_ = 0; _b_ < list.length; _b_++)
        {
            line = list[_b_]
            compare(line.length,80)
        }
    })
    section("the hour is in the same column on blanked and dated rows", function ()
    {
        lines = runOn(daysDb()).split('\n')
        compare((at_(lines[1],'12:00')),(at_(lines[0],'11:00')))
        compare((at_(lines[3],'14:00')),(at_(lines[2],'08:00')))
    })
    section("ids are listed with every date shown", function ()
    {
        lines = runOn(daysDb(),['2222','4444']).split('\n')
        compare((lines.map(dateOf)),['07.10','11.10'])
    })
    section("a title argument lists with every date shown", function ()
    {
        lines = runOn(daysDb(),['same day']).split('\n')
        compare((lines.map(dateOf)),['07.10','07.10'])
    })
    section("one row only shows its date", function ()
    {
        rows = runOn(daysDb(),['1111']).split('\n')
        compare((dateOf(rows[0])),'07.10')
    })
    section("a session with no messages groups on its update time", function ()
    {
        database = daysDb()
        stmt = database.prepare("INSERT INTO session_v2 (id, parent_id, title, time_created, time_updated) VALUES (?, ?, ?, ?, ?)")
        created = (new Date(2026,8,13,1,0,0,0)).getTime()
        updated = (new Date(2026,9,7,12,30,0,0)).getTime()
        stmt.run('ses_0000000000000000000000006',null,'no messages',created,updated)
        lines = runOn(database).split('\n')
        compare((lines.map(timeOf)),['11:00','12:00','12:30','08:00','14:00','01:00'])
        compare((lines.map(dateOf)),['07.10',undefined,undefined,'11.10',undefined,'13.10'])
        database.close()
    })
    section("the shared fixture groups too", function ()
    {
        lines = run([]).split('\n')
        dates = lines.map(dateOf)
        first = dates.indexOf(undefined)
        compare(first === -1 || first > 0,true)
    })
}
toExport["ls date grouping"]._section_ = true
toExport["ls"] = function ()
{
    section("no ids lists every session, one row each", function ()
    {
        compare((run([]).split('\n').length),3)
    })
    section("ids filter the rows", function ()
    {
        lines = run(['bbbbbb']).split('\n')
        compare(lines.length,1)
        compare((lines[0].trimStart().startsWith('bbbbbb')),true)
    })
    section("a title argument selects rows too", function ()
    {
        lines = run(['ocls']).split('\n')
        compare(lines.length,1)
        compare((lines[0].includes('Coco - ocls')),true)
    })
    section("ids and titles can be mixed", function ()
    {
        compare((run(['ocls','bbbbbb']).split('\n').length),2)
    })
    section("unknown id surfaces the error", function ()
    {
        throws((function ()
        {
            return run(['zzzzzz'])
        }),/no\x20session/i)
    })
    section("output ends without a trailing blank line", function ()
    {
        every = run([])
        compare(!(every.endsWith('\n')),true)
    })
    section("the date column shows the last turn, not the session start", function ()
    {
        sessions = query.listSessions(db.openDb(DB_PATH),['aaaaaa'])
        rows = run(['aaaaaa']).split('\n')
        compare((rows[0].includes(stamp(sessions[0].time_last))),true)
        compare(!(rows[0].includes(stamp(sessions[0].time_created))),true)
    })
    section("each row adds up: last turn minus duration is the session start", function ()
    {
        sessions = query.listSessions(db.openDb(DB_PATH),[])
        rows = run([]).split('\n')
        compare(rows.length,sessions.length)
        checked = sessions.filter(function (s)
        {
            return s.time_last >= s.time_created
        })
        compare(checked.length > 0,true)
        var list1 = _k_.list(checked)
        for (var _c_ = 0; _c_ < list1.length; _c_++)
        {
            session = list1[_c_]
            i = sessions.indexOf(session)
            m = (/^\x20\w{6}\x20+(?:\d\d\.\d\d)?\x20*\d\d:\d\d\x20+(\d+)\x20/).exec(rows[i])
            start = new Date(session.time_last - Number(m[1]) * 60000)
            compare(Math.abs(start - session.time_created) <= 60000,true)
        }
    })
}
toExport["ls"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHMuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9scy5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7OztPQVFPLE9BQU8sS0FBSzs7Ozs7Ozs7Ozs7QUFNbkIsVUFBVSxNQUFNLFdBQVc7QUFFM0IsUUFBUSxNQUFNLFlBQVk7O0FBRTFCOzs7O0lBRUksV0FBVyxHQUFHLE9BQU87V0FDckIsSUFBSSxHQUFJLFNBQVUsU0FBVSxLQUFNLE1BQUEsTUFBTyxNQUFPOzs7QUFFcEQ7O1dBQXlDLElBQUksR0FBSSxTQUFVLFNBQVUsS0FBTSxNQUFBLE1BQU8sTUFBTzs7O0FBSXpGOzs7O0lBRUksZUFBZSxPQUFPLGFBQWE7SUFFbkMsU0FBUyxLQUFLOzs7Ozs7OztJQVdkLFNBQVMsU0FBUyxRQUFRO0lBQzFCLFVBQVUsU0FBUyxRQUFRO0lBRTNCOztvQkFBa0MsS0FBSyxLQUFNLFFBQVEsRUFBRyxLQUFNLE1BQU8sRUFBRyxFQUFHLElBQUc7O0lBSTlFLFNBQ0ssT0FBUSxHQUFJLEVBQUcsR0FBSSxtQkFDbkIsT0FBUSxHQUFJLEVBQUcsR0FBSSxvQkFDbkIsT0FBUSxHQUFJLEdBQUksRUFBRyxtQkFDbkIsT0FBUSxHQUFJLEdBQUksR0FBSSxvQkFDcEIsT0FBUSxHQUFJLEdBQUksRUFBRzt3QkFHYjs7OztRQUNQLFlBQVksSUFBSSxLQUFLLElBQUksT0FBTztRQUNoQyxPQUFPLEdBQUcsSUFBSSxHQUFJLElBQUksR0FBSSxJQUFJO1FBQzlCLE9BQU8sSUFBSSxHQUFJLEtBQU0sSUFBSSxHQUFJLG9CQUFxQixPQUFPLFFBQVM7UUFDbEUsUUFBUSxTQUFTLElBQUksS0FBTSxHQUFJLE9BQVEsRUFBRyxLQUFNLEtBQUssV0FBVyxLQUFNOztXQUUxRTs7O0FBSUo7Ozs7SUFDSSxLQUFLLCtCQUErQixLQUFLO1FBQ3RDLE1BQUs7O2VBQVk7O1dBQ3BCLEVBQUU7OztBQUVOOzs7O0lBQ0ksS0FBSyxrREFBa0QsS0FBSztRQUN6RCxNQUFLOztlQUFZOztXQUNwQixFQUFFOzs7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
//# sourceURL=file://kode/test/ls.kode
