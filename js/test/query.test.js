var A, C, database, DB_PATH, ids

import test from 'node:test'
import assert from 'node:assert/strict'
import sqlite from 'node:sqlite'
import build from "./fixtures/build.js"

import db from "../db.js"

import query from "../query.js"

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
test.describe('listSessions filtering',function ()
{
    test('returns every top-level session, oldest last message first',function ()
    {
        return assert.deepEqual(ids(),['ses_bbbbbbbbbbbbbbbbbbbbbbb2',C,A])
    })
    test('excludes child sessions',function ()
    {
        return assert.ok(!ids().includes('ses_ddddddddddddddddddddddd4'))
    })
    test('carries the directory the session runs in',function ()
    {
        var byId

        byId = function (id)
        {
            return query.listSessions(database,[id])[0]
        }
        assert.equal(byId(A).directory,'/home/kodi/a/coco')
        return assert.equal(byId('ses_bbbbbbbbbbbbbbbbbbbbbbb2').directory,'/home/kodi/.config')
    })
    test('filters by a 6-character prefix',function ()
    {
        var found

        found = query.listSessions(database,['cccccc'])
        assert.equal(found.length,1)
        return assert.equal(found[0].id,C)
    })
    test('accepts a prefix with the ses_ prefix included',function ()
    {
        return assert.equal(query.listSessions(database,["ses_aaaaaa"]).length,1)
    })
    test('matches several prefixes at once, keeping the query order',function ()
    {
        return assert.deepEqual(query.listSessions(database,['ccccccc','aaaaaaa']).map(function (s)
        {
            return s.id
        }),[C,A])
    })
    test('matches a title substring, case insensitive',function ()
    {
        assert.deepEqual(query.listSessions(database,['ocls']).map(function (s)
        {
            return s.id
        }),[A])
        assert.deepEqual(query.listSessions(database,['OCLS']).map(function (s)
        {
            return s.id
        }),[A])
        return assert.deepEqual(query.listSessions(database,['Coco']).map(function (s)
        {
            return s.id
        }),[A])
    })
    test('matches anywhere in a title, not only the start',function ()
    {
        assert.deepEqual(query.listSessions(database,['hyprsession']).map(function (s)
        {
            return s.id
        }),[C])
        return assert.deepEqual(query.listSessions(database,['hypr']).map(function (s)
        {
            return s.id
        }),[C])
    })
    test('an id still wins over a title',function ()
    {
        return assert.deepEqual(query.listSessions(database,['aaaaaaa']).map(function (s)
        {
            return s.id
        }),[A])
    })
    test('ids and titles can be mixed, in the order given',function ()
    {
        assert.deepEqual(query.listSessions(database,['conny','aaaaaaa']).map(function (s)
        {
            return s.id
        }),[C,A])
        return assert.deepEqual(query.listSessions(database,['aaaaaaa','conny']).map(function (s)
        {
            return s.id
        }),[A,C])
    })
    test('overlapping title arguments list a session once',function ()
    {
        return assert.deepEqual(query.listSessions(database,['ocls','coco']).map(function (s)
        {
            return s.id
        }),[A])
    })
    test('title search never finds a child session',function ()
    {
        return assert.throws(function ()
        {
            query.listSessions(database,['child'])
            return /no\x20session/i
        })
    })
    test('an ambiguous id prefix does not fall through to titles',function ()
    {
        return assert.throws(function ()
        {
            query.listSessions(database,['ses_'])
            return /matches\x20\d+\x20sessions/i
        })
    })
    test('sql wildcards in an argument stay literal',function ()
    {
        assert.throws(function ()
        {
            query.listSessions(database,['%'])
            return /no\x20session/i
        })
        return assert.throws(function ()
        {
            query.listSessions(database,['_'])
            return /no\x20session/i
        })
    })
    test('a term matching nothing is an error',function ()
    {
        return assert.throws(function ()
        {
            query.listSessions(database,['zzzzzz'])
            return /no\x20session/i
        })
    })
    test('unknown prefix is an error',function ()
    {
        return assert.throws(function ()
        {
            query.listSessions(database,['zzzzzz'])
            return function (e)
            {
                return e instanceof db.OclsError && (/no\x20session/i).test(e.message)
            }
        })
    })
    return test('ambiguous prefix is an error',function ()
    {
        return assert.throws(function ()
        {
            query.listSessions(database,['ses_'])
            return function (e)
            {
                return e instanceof db.OclsError && (/matches\x20\d+\x20sessions/i).test(e.message)
            }
        })
    })
})
test.describe('listSessions ordering',function ()
{
    test('follows the last message, not the update time',function ()
    {
        var byId, pairs, rows

        rows = query.listSessions(database,[])
        pairs = rows.map(function (s)
        {
            return [s.id,s]
        })
        byId = Object.fromEntries(pairs)
        assert.ok(byId[A].time_last > byId[C].time_last)
        assert.ok(byId[A].time_updated < byId[C].time_updated)
        return assert.equal(rows.at(-1).id,A)
    })
    return test('a session with no messages sorts on its update time',function ()
    {
        var empty, insert, message

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
        assert.deepEqual(query.listSessions(empty,[]).map(function (s)
        {
            return s.id
        }),['ses_2222222222222222222222b','ses_1111111111111111111111a'])
        return empty.close()
    })
})
test.describe('listSessions row data',function ()
{
    test('counts turns from user messages with text only',function ()
    {
        var byId, pairs

        pairs = query.listSessions(database,[]).map(function (s)
        {
            return [s.id,s.turns]
        })
        byId = Object.fromEntries(pairs)
        assert.equal(byId[A],2)
        assert.equal(byId['ses_bbbbbbbbbbbbbbbbbbbbbbb2'],0)
        return assert.equal(byId[C],1)
    })
    test('null title comes through as null',function ()
    {
        var second

        second = query.listSessions(database,['bbbbbb'])[0]
        assert.equal(second.title,null)
        assert.equal(second.time_created,build.BASE + 120000)
        return assert.equal(second.time_updated,build.BASE + 180000)
    })
    test('time_last is the time of the newest message',function ()
    {
        var byId, pairs

        pairs = query.listSessions(database,[]).map(function (s)
        {
            return [s.id,s.time_last]
        })
        byId = Object.fromEntries(pairs)
        assert.equal(byId[A],build.BASE + 7 * 1000)
        assert.equal(byId['ses_bbbbbbbbbbbbbbbbbbbbbbb2'],build.BASE + 2 * 1000)
        return assert.equal(byId[C],build.BASE + 4 * 1000)
    })
    return test('time_last falls back to the update time of a session with no messages',function ()
    {
        var empty, insert, rows

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
        assert.equal(rows[0].time_last,build.BASE + 42)
        return empty.close()
    })
})