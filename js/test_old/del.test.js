var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var A, C, deleteA, io, plain, rowCount, run, throwsOcls, withDb

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "../test/fixtures/build.js"

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsLnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdF9vbGQvZGVsLnRlc3Qua29kZSJdLCJtYXBwaW5ncyI6Ijs7OztPQVFPLEtBQUssS0FBSztPQUNWLE9BQU8sS0FBSzs7Ozs7Ozs7O0FBT25CLFFBQVEsTUFBTSxZQUFZO0FBRTFCLElBQUk7QUFDSixJQUFJOztBQUlKOzs7O0lBRUk7SUFDQSxVQUFVLE9BQU8sTUFBTTtJQUV2Qjs7ZUFBa0IsSUFBSSxLQUFLOztJQUMzQjs7WUFBbUIsUUFBUTs7bUJBQVksUUFBUTs7OzttQkFBYTs7O0lBRTVEOztlQUFZLElBQUksS0FBSzs7WUFFckIsWUFBYSxZQUNiLE1BQU8sTUFDUCxXQUFZLFdBQ1osT0FBUTs7O0FBTVo7Ozs7SUFFSSxXQUFXLEdBQUc7SUFDZCxXQUFXLEdBQUcsYUFBYSxNQUFNOzs7UUFHN0IsTUFBTSxLQUFLLEdBQUksU0FBVSxTQUFVLElBQUssTUFBQSxNQUFPLE1BQU8sTUFBTyxHQUFJO1FBQ2pFLE9BQU0sUUFBUyxJQUFJLFFBQVMsS0FBTSxTQUFTOztXQUN6Qzs7UUFDRixTQUFTO1FBQ1QsTUFBTTs7SUFFVixTQUFTO1dBQ1Q7OztBQUVKOzs7O0lBRUksV0FBVyxHQUFHLGFBQWEsTUFBTTs7O1FBRzdCLE1BQU0sR0FBRzs7V0FDUDs7UUFDRixTQUFTO1FBQ1QsTUFBTTs7SUFFVixTQUFTO1dBQ1Q7OztBQUVKOztXQUNJLEtBQUssR0FBSSxTQUFVLFVBQVcsVUFBVyxNQUFPLEdBQUksTUFBTyxNQUFPLEdBQUksR0FBRzs7O0FBRTdFOztXQUNJLFNBQVMsUUFBUSxxREFBcUQsSUFBSSxJQUFJOzs7QUFLbEY7Ozs7ZUFBaUMsYUFBYSxHQUFHLGNBQWUsUUFBUSxLQUFLLEVBQUU7OztBQUUvRSxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7ZUFFRDs7WUFDSSxTQUFTLFFBQVEsdUNBQXVDLElBQUk7bUJBQzVELE9BQU8sTUFBTSxTQUFTLFNBQVUsR0FBSTs7O0lBRTVDLEtBQUs7O2VBRUQ7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
//# sourceURL=file://kode/test_old/del.test.kode
