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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsLnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9kZWwudGVzdC5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7O09BUU8sS0FBSyxLQUFLO09BQ1YsT0FBTyxLQUFLOzs7Ozs7Ozs7QUFPbkIsUUFBUSxNQUFNLFlBQVk7QUFFMUIsSUFBSTtBQUNKLElBQUk7O0FBSUo7Ozs7SUFFSTtJQUNBLFVBQVUsT0FBTyxNQUFNO0lBRXZCOztlQUFrQixJQUFJLEtBQUs7O0lBQzNCOztZQUFtQixRQUFROzttQkFBWSxRQUFROzs7O21CQUFhOzs7SUFFNUQ7O2VBQVksSUFBSSxLQUFLOztZQUVyQixZQUFhLFlBQ2IsTUFBTyxNQUNQLFdBQVksV0FDWixPQUFROzs7QUFNWjs7OztJQUVJLFdBQVcsR0FBRztJQUNkLFdBQVcsR0FBRyxhQUFhLE1BQU07OztRQUc3QixNQUFNLEtBQUssR0FBSSxTQUFVLFNBQVUsSUFBSyxNQUFBLE1BQU8sTUFBTyxNQUFPLEdBQUk7UUFDakUsT0FBTSxRQUFTLElBQUksUUFBUyxLQUFNLFNBQVM7O1dBQ3pDOztRQUNGLFNBQVM7UUFDVCxNQUFNOztJQUVWLFNBQVM7V0FDVDs7O0FBRUo7Ozs7SUFFSSxXQUFXLEdBQUcsYUFBYSxNQUFNOzs7UUFHN0IsTUFBTSxHQUFHOztXQUNQOztRQUNGLFNBQVM7UUFDVCxNQUFNOztJQUVWLFNBQVM7V0FDVDs7O0FBRUo7O1dBQ0ksS0FBSyxHQUFJLFNBQVUsVUFBVyxVQUFXLE1BQU8sR0FBSSxNQUFPLE1BQU8sR0FBSSxHQUFHOzs7QUFFN0U7O1dBQ0ksU0FBUyxRQUFRLHFEQUFxRCxJQUFJLElBQUk7OztBQUtsRjs7OztlQUFpQyxhQUFhLEdBQUcsY0FBZSxRQUFRLEtBQUssRUFBRTs7O0FBRS9FLEtBQUssU0FBUzs7SUFFVixLQUFLOztlQUVEOztZQUNJLFNBQVMsUUFBUSx1Q0FBdUMsSUFBSTttQkFDNUQsT0FBTyxNQUFNLFNBQVMsU0FBVSxHQUFJOzs7SUFFNUMsS0FBSzs7ZUFFRDs7OztZQUNJLFNBQVMsU0FBUyxRQUFRLHVCQUF1QjttQkFDakQsT0FBTyxNQUFNLE9BQU8sYUFBYzs7O1dBRTFDLEtBQUs7O2VBRUQsT0FBTzs7bUJBQVcsR0FBRyxhQUFhO1dBQThCLEdBQUc7OztBQUUzRSxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7ZUFFRCxPQUFPOzttQkFBVztXQUFVLFdBQVc7O0lBRTNDLEtBQUs7Ozs7b0JBRWEsSUFBSTs7OztZQUNkLFVBQVUsV0FBVztZQUtyQixPQUFPOzt1QkFBVyxLQUFLO2VBQVUsV0FBWTs7O0lBRXJELEtBQUs7Ozs7UUFFRCxZQUFZLEtBQUssT0FBTztRQUV4Qjs7bUJBQWUsRUFBRSxRQUFRLFNBQVMsU0FBVSxFQUFFLFFBQVEsU0FBUzs7ZUFFL0QsT0FBTzs7bUJBQVcsSUFBSTtXQUFZOztJQUV0QyxLQUFLOztlQUVEOzs7O1lBQ0ksU0FBUyxHQUFJLFNBQVUsVUFBVyxNQUFPLE1BQU8sR0FBSSxNQUFPLE1BQU8sR0FBSSxHQUFHO1lBRXpFLE9BQU87O3VCQUFVLElBQUk7O21CQUNyQixPQUFPLE1BQU0sU0FBUyxTQUFVLEdBQUk7OztJQUU1QyxLQUFLOzs7O1FBRUQsTUFBTSxLQUFLLE9BQVEsS0FBSztlQUN4QixPQUFPLFVBQVUsS0FBTTs7SUFFM0IsS0FBSzs7ZUFFRCxPQUFPOzttQkFBVyxLQUFLO1dBQWE7O1dBRXhDLEtBQUs7O2VBRUQ7Ozs7WUFDSSxPQUFPLEdBQUksU0FBVSxVQUFXLFVBQVcsTUFBTyxHQUFJLE1BQU8sTUFBTyxHQUFJLEdBQUcsSUFBSzttQkFFaEYsT0FBTzs7dUJBQVcsSUFBSTtlQUFPLFdBQVc7Ozs7QUFRcEQsS0FBSyxTQUFTOztJQUVWLEtBQUs7Ozs7UUFFRCxNQUFNLEtBQUs7UUFDWCxPQUFPLElBQUk7UUFFWCxPQUFPLE1BQU0sS0FBTTtRQUNuQixPQUFPLE1BQU0sS0FBTTtlQUNuQixPQUFPLE1BQU0sS0FBTTs7SUFFdkIsS0FBSzs7OztRQUVELE1BQU0sS0FBSztRQUNYLE9BQU8sSUFBSTtRQUVYLE9BQU8sR0FBRyxLQUFLLFFBQVEscUJBQXFCLEtBQUssUUFBUTtlQUN6RCxPQUFPLEdBQUcsS0FBSyxRQUFRLFlBQVksS0FBSyxRQUFROztJQUVwRCxLQUFLOzs7O1FBRUQsTUFBTSxLQUFLLFVBQVc7UUFFdEIsT0FBTyxVQUFVLElBQUk7ZUFDckIsT0FBTyxNQUFNLElBQUksS0FBTTs7SUFFM0IsS0FBSzs7OztRQUVELFFBQVEsS0FBSyxVQUFXLElBQUk7ZUFDNUIsT0FBTyxVQUFVOztJQUVyQixLQUFLOzs7O1FBRUQsUUFBUSxLQUFLLFVBQVcsU0FBUztlQUNqQyxPQUFPLFVBQVU7O1dBRXJCLEtBQUs7Ozs7UUFFRCxTQUFTLEtBQUssVUFBVyxPQUFPO2VBQ2hDLE9BQU8sTUFBTSxPQUFPLE9BQVE7OztBQVFwQyxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7ZUFFRDs7WUFDSSxLQUFLLEdBQUksU0FBVSxVQUFXLFFBQVMsTUFBTyxHQUFJLE1BQU8sTUFBTyxHQUFJLEdBQUc7WUFDdkUsT0FBTyxNQUFNLFNBQVMsU0FBVSxHQUFJO21CQUNwQyxPQUFPLE1BQU0sU0FBUyxTQUFVLEdBQUk7OztJQUU1QyxLQUFLOztlQUVEOzs7O1lBQ0ksUUFBUSxVQUFVO1lBQ2xCLEtBQUssR0FBSSxTQUFVLFNBQVUsS0FBTSxNQUFPLEdBQUksTUFBTyxNQUFPLEdBQUksR0FBRzttQkFDbkUsT0FBTyxNQUFNLFNBQVMsU0FBVSxHQUFJOzs7SUFFNUMsS0FBSzs7ZUFFRDs7WUFDSSxRQUFRO21CQUNSLE9BQU8sTUFBTSxTQUFTLFNBQVUsR0FBSTs7O0lBRTVDLEtBQUs7O2VBRUQ7Ozs7WUFFSSxTQUFTLE1BQU0sVUFBVSxTQUFVO1lBRW5DLFFBQVEsT0FBTyxPQUFPO1lBQ3RCLE9BQU8sR0FBRyxNQUFNOzt1QkFBYSxJQUFJO2lFQUNxQixLQUFLLFVBQVU7WUFFckUsUUFBUTtnQ0FFSyxPQUFPLFFBQVEsTUFBTSxVQUFVLFNBQVU7Ozs7Z0JBQ2xELE9BQU8sTUFBTSxNQUFNLEdBQUksS0FBTSxNQUFNLFdBQVcsTUFBTTs7OztJQUVoRSxLQUFLOztlQUVEOzs7O1lBQ0ksUUFBUTtZQUNSLE9BQU8sTUFBTSxTQUFTLFNBQVUsR0FBSTtZQUNwQyxTQUFTLE9BQU8sT0FBTyxNQUFNLFVBQVUsU0FBVTttQkFDakQsT0FBTyxHQUFHLE9BQU87O3VCQUFhLElBQUk7Ozs7SUFFMUMsS0FBSzs7OztRQUVELE9BQU8sS0FBSyxTQUFVLFdBQVc7ZUFDakMsT0FBTyxVQUFVLE1BQU8sRUFBRzs7V0FFL0IsS0FBSzs7ZUFFRDs7WUFDSSxRQUFRLFNBQVU7bUJBQ2xCLE9BQU8sTUFBTSxTQUFTLFNBQVUsR0FBSSJ9
//# sourceURL=file://kode/test/del.test.kode
