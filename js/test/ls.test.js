var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var at_, dateOf, daysDb, DB_PATH, plain, run, runOn, stamp, timeOf

import test from 'node:test'
import assert from 'node:assert/strict'
import sqlite from 'node:sqlite'
import build from "./fixtures/build.js"

import db from "../db.js"

import query from "../query.js"

import ls from "../ls.js"

import style from "../style.js"

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
test.describe('ls date grouping',function ()
{
    test('a session repeating the previous row\'s date shows spaces instead',function ()
    {
        var lines

        lines = runOn(daysDb()).split('\n')
        assert.equal(dateOf(lines[0]),'07.10')
        assert.equal(dateOf(lines[1]),undefined)
        assert.equal(dateOf(lines[2]),'11.10')
        assert.equal(dateOf(lines[3]),undefined)
        return assert.equal(dateOf(lines[4]),'13.10')
    })
    test('the time is still printed on a blanked row',function ()
    {
        var lines

        lines = runOn(daysDb()).split('\n')
        return assert.deepEqual(lines.map(timeOf),['11:00','12:00','08:00','14:00','01:00'])
    })
    test('every row keeps its full width when the date is blanked',function ()
    {
        var line

        var list = _k_.list(runOn(daysDb()).split('\n'))
        for (var _b_ = 0; _b_ < list.length; _b_++)
        {
            line = list[_b_]
            assert.equal(line.length,80,JSON.stringify(line))
        }
    })
    test('the hour is in the same column on blanked and dated rows',function ()
    {
        var lines

        lines = runOn(daysDb()).split('\n')
        assert.equal(at_(lines[1],'12:00'),at_(lines[0],'11:00'))
        return assert.equal(at_(lines[3],'14:00'),at_(lines[2],'08:00'))
    })
    test('ids are listed with every date shown',function ()
    {
        var lines

        lines = runOn(daysDb(),['2222','4444']).split('\n')
        return assert.deepEqual(lines.map(dateOf),['07.10','11.10'])
    })
    test('a title argument lists with every date shown',function ()
    {
        var lines

        lines = runOn(daysDb(),['same day']).split('\n')
        return assert.deepEqual(lines.map(dateOf),['07.10','07.10'])
    })
    test('one row only shows its date',function ()
    {
        var rows

        rows = runOn(daysDb(),['1111']).split('\n')
        return assert.equal(dateOf(rows[0]),'07.10')
    })
    test('a session with no messages groups on its update time',function ()
    {
        var created, database, lines, stmt, updated

        database = daysDb()
        stmt = database.prepare("INSERT INTO session_v2 (id, parent_id, title, time_created, time_updated) VALUES (?, ?, ?, ?, ?)")
        created = (new Date(2026,8,13,1,0,0,0)).getTime()
        updated = (new Date(2026,9,7,12,30,0,0)).getTime()
        stmt.run('ses_0000000000000000000000006',null,'no messages',created,updated)
        lines = runOn(database).split('\n')
        assert.deepEqual(lines.map(timeOf),['11:00','12:00','12:30','08:00','14:00','01:00'])
        assert.deepEqual(lines.map(dateOf),['07.10',undefined,undefined,'11.10',undefined,'13.10'])
        return database.close()
    })
    return test('the shared fixture groups too',function ()
    {
        var dates, first, lines

        lines = run([]).split('\n')
        dates = lines.map(dateOf)
        first = dates.indexOf(undefined)
        return assert.ok(first === -1 || first > 0,'a blank date before any printed one')
    })
})
test.describe('ls',function ()
{
    test('no ids lists every session, one row each',function ()
    {
        return assert.equal(run([]).split('\n').length,3)
    })
    test('ids filter the rows',function ()
    {
        var lines

        lines = run(['bbbbbb']).split('\n')
        assert.equal(lines.length,1)
        return assert.ok(lines[0].trimStart().startsWith,'bbbbbb')
    })
    test('a title argument selects rows too',function ()
    {
        var lines

        lines = run(['ocls']).split('\n')
        assert.equal(lines.length,1)
        return assert.ok(lines[0].includes('Coco - ocls'))
    })
    test('ids and titles can be mixed',function ()
    {
        return assert.equal(run(['ocls','bbbbbb']).split('\n').length,2)
    })
    test('unknown id surfaces the error',function ()
    {
        return assert.throws(function ()
        {
            run(['zzzzzz'])
            return /no\x20session/i
        })
    })
    test('output ends without a trailing blank line',function ()
    {
        var every

        every = run([])
        return assert.ok(!every.endsWith('\n'))
    })
    test('the date column shows the last turn, not the session start',function ()
    {
        var rows, sessions

        sessions = query.listSessions(db.openDb(DB_PATH),['aaaaaa'])
        rows = run(['aaaaaa']).split('\n')
        assert.ok(rows[0].includes(stamp(sessions[0].time_last)),rows[0])
        return assert.ok(!rows[0].includes(stamp(sessions[0].time_created)),rows[0])
    })
    return test('each row adds up: last turn minus duration is the session start',function ()
    {
        var checked, i, m, rows, session, sessions, start

        sessions = query.listSessions(db.openDb(DB_PATH),[])
        rows = run([]).split('\n')
        assert.equal(rows.length,sessions.length)
        checked = sessions.filter(function (s)
        {
            return s.time_last >= s.time_created
        })
        assert.ok(checked.length > 0,'no session to check')
        var list = _k_.list(checked)
        for (var _c_ = 0; _c_ < list.length; _c_++)
        {
            session = list[_c_]
            i = sessions.indexOf(session)
            m = (/^\x20\w{6}\x20+(?:\d\d\.\d\d)?\x20*\d\d:\d\d\x20+(\d+)\x20/).exec(rows[i])
            start = new Date(session.time_last - Number(m[1]) * 60000)
            assert.ok(Math.abs(start - session.time_created) <= 60000,`${session.title}: ${start.toISOString()} vs ${new Date(session.time_created).toISOString()}`)
        }
    })
})