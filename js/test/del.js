var toExport = {}
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var A, agreed, both, C, deleteA, empty, got, io, isOcls, maybe, names, plain, refused, res, rowCount, run, short, text, throwsOcls, tooShort, withDb

import build from "../test/fixtures/build.js"

import db from "../db.js"

import del from "../del.js"

import style from "../style.js"

import helpers from "./helpers.js"
let matches = helpers.matches
let throws = helpers.throws

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

isOcls = function (e)
{
    return e instanceof db.OclsError
}
toExport["openWritable"] = function ()
{
    section("can actually write", function ()
    {
        withDb(function (database)
        {
            database.prepare('DELETE FROM session_v2 WHERE id = ?').run(A)
            return compare(rowCount(database,A),0)
        })
    })
    section("has foreign keys enforced", function ()
    {
        withDb(function (database)
        {
            var pragma

            pragma = database.prepare('PRAGMA foreign_keys').get()
            return compare(pragma.foreign_keys,1)
        })
    })
    section("rejects a bad schema the same way openDb does", function ()
    {
        throws((function ()
        {
            return db.openWritable('/nonexistent/opencode.db')
        }),isOcls)
    })
}
toExport["openWritable"]._section_ = true
toExport["del guards"] = function ()
{
    section("no ids is an error, and nothing is printed first", function ()
    {
        throws((function ()
        {
            return run([])
        }),throwsOcls(/id/i))
    })
    section("an argument shorter than three characters is refused", function ()
    {
        var list = ['a','ab']
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            short = list[_a_]
            refused = throwsOcls(/at\x20least\x203\x20characters/i)
            throws((function ()
            {
                return run([short])
            }),refused)
        }
    })
    section("the refusal names the arguments it rejected", function ()
    {
        tooShort = ['ab','ocls','cd']
        names = function (e)
        {
            var _124_32_

            return (e.message != null) && e.message.includes('ab') && e.message.includes('cd')
        }
        throws((function ()
        {
            return run(tooShort)
        }),names)
    })
    section("nothing is deleted when an argument is too short", function ()
    {
        withDb(function (database)
        {
            short = {db:database,prefixes:['ab'],width:80,style:plain,io:io('y')}
            throws(function ()
            {
                return del(short)
            })
            return compare(rowCount(database,A),1)
        })
    })
    section("a three character title argument is accepted", function ()
    {
        got = run(['oco'],'y').deleted
        compare(got,[A])
    })
    section("an unknown id errors before the warning", function ()
    {
        throws((function ()
        {
            return run(['zzzzzz'])
        }),/no\x20session/i)
    })
    section("a non-interactive terminal refuses without deleting", function ()
    {
        withDb(function (database)
        {
            var opt

            opt = {db:database,prefixes:['aaaaaa'],width:80,style:plain,io:io('y',false)}
            return throws((function ()
            {
                return del(opt)
            }),throwsOcls(/terminal/i))
        })
    })
}
toExport["del guards"]._section_ = true
toExport["del confirmation"] = function ()
{
    section("shows a warning, the sessions, and the question", function ()
    {
        res = run(['aaaaaa'])
        text = res.text
        matches(text,/DELETE\x20SESSIONS/)
        matches(text,/aaaaaa.*Coco\x20-\x20ocls/s)
        matches(text,/ARE\x20YOU\x20SURE\?\x20\(yN\)/)
    })
    section("the warning comes before the session list", function ()
    {
        res = run(['aaaaaa'])
        text = res.text
        compare(text.indexOf('DELETE SESSIONS') < text.indexOf('aaaaaa'),true)
        compare(text.indexOf('aaaaaa') < text.indexOf('ARE YOU SURE'),true)
    })
    section("n aborts without deleting", function ()
    {
        res = run(['aaaaaa'],'n')
        compare(res.deleted,[])
        matches(res.text,/nothing\x20deleted/i)
    })
    section("empty input aborts", function ()
    {
        empty = run(['aaaaaa'],'').deleted
        compare(empty,[])
    })
    section("anything other than y aborts", function ()
    {
        maybe = run(['aaaaaa'],'maybe').deleted
        compare(maybe,[])
    })
    section("yes is accepted too", function ()
    {
        agreed = run(['aaaaaa'],'yes').deleted
        compare(agreed.length,1)
    })
}
toExport["del confirmation"]._section_ = true
toExport["del deletion"] = function ()
{
    section("accepts a title argument and deletes what it matched", function ()
    {
        withDb(function (database)
        {
            del({db:database,prefixes:['ocls'],width:80,style:plain,io:io('y')})
            compare(rowCount(database,A),0)
            return compare(rowCount(database,C),1)
        })
    })
    section("accepts a mix of ids and titles", function ()
    {
        withDb(function (database)
        {
            var both

            both = ['aaaaaaa','ocls']
            del({db:database,prefixes:both,width:80,style:plain,io:io('y')})
            return compare(rowCount(database,A),0)
        })
    })
    section("removes the session row", function ()
    {
        withDb(function (database)
        {
            deleteA(database)
            return compare(rowCount(database,A),0)
        })
    })
    section("cascades to all five child tables", function ()
    {
        withDb(function (database)
        {
            var before, entry, every

            before = build.countRows(database,A)
            every = Object.values(before)
            compare(every.every(function (n)
            {
                return n > 0
            }),true)
            deleteA(database)
            var list1 = _k_.list(Object.entries(build.countRows(database,A)))
            for (var _b_ = 0; _b_ < list1.length; _b_++)
            {
                entry = list1[_b_]
                compare(entry[1],0)
            }
        })
    })
    section("leaves other sessions and their children alone", function ()
    {
        withDb(function (database)
        {
            var others

            deleteA(database)
            compare(rowCount(database,C),1)
            others = Object.values(build.countRows(database,C))
            return compare(others.every(function (n)
            {
                return n > 0
            }),true)
        })
    })
    section("reports what it deleted, in the ids given", function ()
    {
        both = run(['aaaaaa','cccccc']).deleted
        compare(both,[A,C])
    })
    section("an aborted delete leaves the rows untouched", function ()
    {
        withDb(function (database)
        {
            deleteA(database,'n')
            return compare(rowCount(database,A),1)
        })
    })
}
toExport["del deletion"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsLmpzIiwic291cmNlcyI6WyIuLi8uLi9rb2RlL3Rlc3QvZGVsLmtvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBY0EsUUFBUSxNQUFNLFlBQVk7QUFFMUIsSUFBSTtBQUNKLElBQUk7O0FBSUo7Ozs7SUFFSTtJQUNBLFVBQVUsT0FBTyxNQUFNO0lBRXZCOztlQUFrQixJQUFJLEtBQUs7O0lBQzNCOztZQUFtQixRQUFROzttQkFBWSxRQUFROzs7O21CQUFhOzs7SUFFNUQ7O2VBQVksSUFBSSxLQUFLOztZQUVyQixZQUFhLFlBQ2IsTUFBTyxNQUNQLFdBQVksV0FDWixPQUFROzs7QUFNWjs7OztJQUVJLFdBQVcsR0FBRztJQUNkLFdBQVcsR0FBRyxhQUFhLE1BQU07OztRQUc3QixNQUFNLEtBQUssR0FBSSxTQUFVLFNBQVUsSUFBSyxNQUFBLE1BQU8sTUFBTyxNQUFPLEdBQUk7UUFDakUsT0FBTSxRQUFTLElBQUksUUFBUyxLQUFNLFNBQVM7O1dBQ3pDOztRQUNGLFNBQVM7UUFDVCxNQUFNOztJQUVWLFNBQVM7V0FDVDs7O0FBRUo7Ozs7SUFFSSxXQUFXLEdBQUcsYUFBYSxNQUFNOzs7UUFHN0IsTUFBTSxHQUFHOztXQUNQOztRQUNGLFNBQVM7UUFDVCxNQUFNOztJQUVWLFNBQVM7V0FDVDs7O0FBRUo7O1dBQ0ksS0FBSyxHQUFJLFNBQVUsVUFBVyxVQUFXLE1BQU8sR0FBSSxNQUFPLE1BQU8sR0FBSSxHQUFHOzs7QUFFN0U7O1dBQ0ksU0FBUyxRQUFRLHFEQUFxRCxJQUFJLElBQUk7OztBQUtsRjs7OztlQUFpQyxhQUFhLEdBQUcsY0FBZSxRQUFRLEtBQUssRUFBRTs7OztBQU0vRTs7V0FBZ0IsYUFBYSxHQUFHOzs7Ozs7UUFNeEI7O1lBQ0ksU0FBUyxRQUFRLHVDQUF1QyxJQUFJOzJCQUM1RCxTQUFTLFNBQVUsR0FBSzs7Ozs7UUFJNUI7Ozs7WUFDSSxTQUFTLFNBQVMsUUFBUSx1QkFBdUI7MkJBQ2pELE9BQU8sYUFBZTs7Ozs7UUFJMUI7O21CQUFXLEdBQUcsYUFBYTtXQUE4Qjs7Ozs7Ozs7UUFNekQ7O21CQUFXO1dBQVUsV0FBVzs7OztvQkFJbEIsSUFBSTs7OztZQUNkLFVBQVUsV0FBVztZQUtyQjs7dUJBQVcsS0FBSztlQUFVOzs7OztRQUk5QixZQUFZLEtBQUssT0FBTztRQUV4Qjs7OztvQkFBZSxFQUFFLG9CQUFhLEVBQUUsUUFBUSxTQUFTLFNBQVUsRUFBRSxRQUFRLFNBQVM7O1FBRTlFOzttQkFBVyxJQUFJO1dBQVk7Ozs7UUFJM0I7O1lBQ0ksU0FBUyxHQUFJLFNBQVUsVUFBVyxNQUFPLE1BQU8sR0FBSSxNQUFPLE1BQU8sR0FBSSxHQUFHO1lBRXpFOzt1QkFBVSxJQUFJOzsyQkFDZCxTQUFTLFNBQVUsR0FBSzs7Ozs7UUFJNUIsTUFBTSxLQUFLLE9BQVEsS0FBSztnQkFDeEIsS0FBTzs7OztRQUlQOzttQkFBVyxLQUFLO1dBQWE7Ozs7UUFJN0I7Ozs7WUFDSSxPQUFPLEdBQUksU0FBVSxVQUFXLFVBQVcsTUFBTyxHQUFJLE1BQU8sTUFBTyxHQUFJLEdBQUcsSUFBSzttQkFFaEY7O3VCQUFXLElBQUk7ZUFBTyxXQUFXOzs7Ozs7Ozs7UUFZckMsTUFBTSxLQUFLO1FBQ1gsT0FBTyxJQUFJO1FBRVgsUUFBUSxLQUFNO1FBQ2QsUUFBUSxLQUFNO1FBQ2QsUUFBUSxLQUFNOzs7O1FBSWQsTUFBTSxLQUFLO1FBQ1gsT0FBTyxJQUFJO2dCQUVYLEtBQUssUUFBUSxxQkFBcUIsS0FBSyxRQUFRLFVBQVk7Z0JBQzNELEtBQUssUUFBUSxZQUFZLEtBQUssUUFBUSxnQkFBa0I7Ozs7UUFJeEQsTUFBTSxLQUFLLFVBQVc7Z0JBRXRCLElBQUk7UUFDSixRQUFRLElBQUksS0FBTTs7OztRQUlsQixRQUFRLEtBQUssVUFBVyxJQUFJO2dCQUM1Qjs7OztRQUlBLFFBQVEsS0FBSyxVQUFXLFNBQVM7Z0JBQ2pDOzs7O1FBSUEsU0FBUyxLQUFLLFVBQVcsT0FBTztnQkFDaEMsT0FBTyxPQUFTOzs7Ozs7OztRQVloQjs7WUFDSSxLQUFLLEdBQUksU0FBVSxVQUFXLFFBQVMsTUFBTyxHQUFJLE1BQU8sTUFBTyxHQUFJLEdBQUc7b0JBQ3ZFLFNBQVMsU0FBVSxHQUFLOzJCQUN4QixTQUFTLFNBQVUsR0FBSzs7Ozs7UUFJNUI7Ozs7WUFDSSxRQUFRLFVBQVU7WUFDbEIsS0FBSyxHQUFJLFNBQVUsU0FBVSxLQUFNLE1BQU8sR0FBSSxNQUFPLE1BQU8sR0FBSSxHQUFHOzJCQUNuRSxTQUFTLFNBQVUsR0FBSzs7Ozs7UUFJNUI7O1lBQ0ksUUFBUTsyQkFDUixTQUFTLFNBQVUsR0FBSzs7Ozs7UUFJNUI7Ozs7WUFFSSxTQUFTLE1BQU0sVUFBVSxTQUFVO1lBRW5DLFFBQVEsT0FBTyxPQUFPO29CQUN0QixNQUFNOzt1QkFBYSxJQUFJO2VBQUs7WUFFNUIsUUFBUTtpQ0FFSyxPQUFPLFFBQVEsTUFBTSxVQUFVLFNBQVU7Ozs7d0JBQ2xELE1BQU0sR0FBSzs7Ozs7O1FBSW5COzs7O1lBQ0ksUUFBUTtvQkFDUixTQUFTLFNBQVUsR0FBSztZQUN4QixTQUFTLE9BQU8sT0FBTyxNQUFNLFVBQVUsU0FBVTsyQkFDakQsT0FBTzs7dUJBQWEsSUFBSTtlQUFLOzs7OztRQUlqQyxPQUFPLEtBQUssU0FBVSxXQUFXO2dCQUNqQyxNQUFRLEVBQUc7Ozs7UUFJWDs7WUFDSSxRQUFRLFNBQVU7MkJBQ2xCLFNBQVMsU0FBVSxHQUFLIn0=
//# sourceURL=file://kode/test/del.kode
