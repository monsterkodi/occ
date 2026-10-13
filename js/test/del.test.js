var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var A, C, deleteA, io, plain, rowCount, run, throwsOcls, withDb

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "./fixtures/build.js"

import db from "../db.js"

import del from "../del.js"

import style from "../style.js"

plain = style.createStyle(false)
A = 'ses_aaaaaaaaaaaaaaaaaaaaaaaaa1'
C = 'ses_ccccccccccccccccccccccc3'

io = function (answer = 'y', interactive = true)
{
    var answers, out, output, readAnswer, write

    out = []
    answers = answer.split('')
    write = function (text)
    {
        return out.push(text)
    }
    readAnswer = function ()
    {
        if (answers.length)
        {
            return answers.shift()
        }
        else
        {
            return undefined
        }
    }
    output = function ()
    {
        return out.join('')
    }
    return {interactive:interactive,write:write,readAnswer:readAnswer,output:output}
}

run = function (ids, answer = 'y', width = 80)
{
    var database, out, res, terminal

    terminal = io(answer)
    database = db.openWritable(build.buildTestDb())
    try
    {
        res = del({db:database,prefixes:ids,width:width,style:plain,io:terminal})
        out = {deleted:res.deleted,text:terminal.output()}
    }
    catch (err)
    {
        database.close()
        throw err
    }
    database.close()
    return out
}

withDb = function (fn)
{
    var database, out

    database = db.openWritable(build.buildTestDb())
    try
    {
        out = fn(database)
    }
    catch (err)
    {
        database.close()
        throw err
    }
    database.close()
    return out
}

deleteA = function (database, answer = 'y')
{
    return del({db:database,prefixes:['aaaaaa'],width:80,style:plain,io:io(answer)})
}

rowCount = function (database, id)
{
    return database.prepare('SELECT count(*) AS c FROM session_v2 WHERE id = ?').get(id).c
}

throwsOcls = function (pattern)
{
    return function (e)
    {
        return e instanceof db.OclsError && (pattern.test(e.message))
    }
}
test.describe('openWritable',function ()
{
    test('can actually write',function ()
    {
        return withDb(function (database)
        {
            database.prepare('DELETE FROM session_v2 WHERE id = ?').run(A)
            return assert.equal(rowCount(database,A),0)
        })
    })
    test('has foreign keys enforced',function ()
    {
        return withDb(function (database)
        {
            var pragma

            pragma = database.prepare('PRAGMA foreign_keys').get()
            return assert.equal(pragma.foreign_keys,1)
        })
    })
    return test('rejects a bad schema the same way openDb does',function ()
    {
        return assert.throws((function ()
        {
            return db.openWritable('/nonexistent/opencode.db')
        }),db.OclsError)
    })
})
test.describe('del guards',function ()
{
    test('no ids is an error, and nothing is printed first',function ()
    {
        return assert.throws((function ()
        {
            return run([])
        }),throwsOcls(/id/i))
    })
    test('an argument shorter than three characters is refused',function ()
    {
        var refused, short

        var list = ['a','ab']
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            short = list[_a_]
            refused = throwsOcls(/at\x20least\x203\x20characters/i)
            assert.throws((function ()
            {
                return run([short])
            }),refused,`${short} should be refused`)
        }
    })
    test('the refusal names the arguments it rejected',function ()
    {
        var names, tooShort

        tooShort = ['ab','ocls','cd']
        names = function (e)
        {
            return e.message.includes('ab') && e.message.includes('cd')
        }
        return assert.throws((function ()
        {
            return run(tooShort)
        }),names)
    })
    test('nothing is deleted when an argument is too short',function ()
    {
        return withDb(function (database)
        {
            var short

            short = {db:database,prefixes:['ab'],width:80,style:plain,io:io('y')}
            assert.throws(function ()
            {
                return del(short)
            })
            return assert.equal(rowCount(database,A),1)
        })
    })
    test('a three character title argument is accepted',function ()
    {
        var got

        got = run(['oco'],'y').deleted
        return assert.deepEqual(got,[A])
    })
    test('an unknown id errors before the warning',function ()
    {
        return assert.throws((function ()
        {
            return run(['zzzzzz'])
        }),/no\x20session/i)
    })
    return test('a non-interactive terminal refuses without deleting',function ()
    {
        return withDb(function (database)
        {
            var opt

            opt = {db:database,prefixes:['aaaaaa'],width:80,style:plain,io:io('y',false)}
            return assert.throws((function ()
            {
                return del(opt)
            }),throwsOcls(/terminal/i))
        })
    })
})
test.describe('del confirmation',function ()
{
    test('shows a warning, the sessions, and the question',function ()
    {
        var res, text

        res = run(['aaaaaa'])
        text = res.text
        assert.match(text,/DELETE\x20SESSIONS/)
        assert.match(text,/aaaaaa.*Coco\x20-\x20ocls/s)
        return assert.match(text,/ARE\x20YOU\x20SURE\?\x20\(yN\)/)
    })
    test('the warning comes before the session list',function ()
    {
        var res, text

        res = run(['aaaaaa'])
        text = res.text
        assert.ok(text.indexOf('DELETE SESSIONS') < text.indexOf('aaaaaa'))
        return assert.ok(text.indexOf('aaaaaa') < text.indexOf('ARE YOU SURE'))
    })
    test('n aborts without deleting',function ()
    {
        var res

        res = run(['aaaaaa'],'n')
        assert.deepEqual(res.deleted,[])
        return assert.match(res.text,/nothing\x20deleted/i)
    })
    test('empty input aborts',function ()
    {
        var empty

        empty = run(['aaaaaa'],'').deleted
        return assert.deepEqual(empty,[])
    })
    test('anything other than y aborts',function ()
    {
        var maybe

        maybe = run(['aaaaaa'],'maybe').deleted
        return assert.deepEqual(maybe,[])
    })
    return test('yes is accepted too',function ()
    {
        var agreed

        agreed = run(['aaaaaa'],'yes').deleted
        return assert.equal(agreed.length,1)
    })
})
test.describe('del deletion',function ()
{
    test('accepts a title argument and deletes what it matched',function ()
    {
        return withDb(function (database)
        {
            del({db:database,prefixes:['ocls'],width:80,style:plain,io:io('y')})
            assert.equal(rowCount(database,A),0)
            return assert.equal(rowCount(database,C),1)
        })
    })
    test('accepts a mix of ids and titles',function ()
    {
        return withDb(function (database)
        {
            var both

            both = ['aaaaaaa','ocls']
            del({db:database,prefixes:both,width:80,style:plain,io:io('y')})
            return assert.equal(rowCount(database,A),0)
        })
    })
    test('removes the session row',function ()
    {
        return withDb(function (database)
        {
            deleteA(database)
            return assert.equal(rowCount(database,A),0)
        })
    })
    test('cascades to all five child tables',function ()
    {
        return withDb(function (database)
        {
            var before, entry, every

            before = build.countRows(database,A)
            every = Object.values(before)
            assert.ok(every.every(function (n)
            {
                return n > 0
            }),`fixture should populate every child table, got ${JSON.stringify(before)}`)
            deleteA(database)
            var list = _k_.list(Object.entries(build.countRows(database,A)))
            for (var _b_ = 0; _b_ < list.length; _b_++)
            {
                entry = list[_b_]
                assert.equal(entry[1],0,`${entry[0]} kept ${entry[1]} rows`)
            }
        })
    })
    test('leaves other sessions and their children alone',function ()
    {
        return withDb(function (database)
        {
            var others

            deleteA(database)
            assert.equal(rowCount(database,C),1)
            others = Object.values(build.countRows(database,C))
            return assert.ok(others.every(function (n)
            {
                return n > 0
            }))
        })
    })
    test('reports what it deleted, in the ids given',function ()
    {
        var both

        both = run(['aaaaaa','cccccc']).deleted
        return assert.deepEqual(both,[A,C])
    })
    return test('an aborted delete leaves the rows untouched',function ()
    {
        return withDb(function (database)
        {
            deleteA(database,'n')
            return assert.equal(rowCount(database,A),1)
        })
    })
})