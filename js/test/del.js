var toExport = {}
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var A, agreed, both, C, deleteA, empty, got, io, isOcls, maybe, names, plain, refused, res, rowCount, run, short, text, throwsOcls, tooShort, withDb

import build from "../test/fixtures/build.js"

import db from "../db.js"
import del from "../del.js"
import style from "../style.js"

import utils from "./utils.js"
let matches = utils.matches
let throws = utils.throws

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
toExport["openWritable"] = async function ()
{
    await section("can actually write", async function ()
    {
        withDb(function (database)
        {
            database.prepare('DELETE FROM session_v2 WHERE id = ?').run(A)
            return compare(rowCount(database,A),0)
        })
    })
    await section("has foreign keys enforced", async function ()
    {
        withDb(function (database)
        {
            var pragma

            pragma = database.prepare('PRAGMA foreign_keys').get()
            return compare(pragma.foreign_keys,1)
        })
    })
    await section("rejects a bad schema the same way openDb does", async function ()
    {
        throws((function ()
        {
            return db.openWritable('/nonexistent/opencode.db')
        }),isOcls)
    })
}
toExport["openWritable"]._section_ = true
toExport["del guards"] = async function ()
{
    await section("no ids is an error, and nothing is printed first", async function ()
    {
        throws((function ()
        {
            return run([])
        }),throwsOcls(/id/i))
    })
    await section("an argument shorter than three characters is refused", async function ()
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
    await section("the refusal names the arguments it rejected", async function ()
    {
        tooShort = ['ab','ocls','cd']
        names = function (e)
        {
            var _122_32_

            return (e.message != null) && e.message.includes('ab') && e.message.includes('cd')
        }
        throws((function ()
        {
            return run(tooShort)
        }),names)
    })
    await section("nothing is deleted when an argument is too short", async function ()
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
    await section("a three character title argument is accepted", async function ()
    {
        got = run(['oco'],'y').deleted
        compare(got,[A])
    })
    await section("an unknown id errors before the warning", async function ()
    {
        throws((function ()
        {
            return run(['zzzzzz'])
        }),/no\x20session/i)
    })
    await section("a non-interactive terminal refuses without deleting", async function ()
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
toExport["del confirmation"] = async function ()
{
    await section("shows a warning, the sessions, and the question", async function ()
    {
        res = run(['aaaaaa'])
        text = res.text
        matches(text,/DELETE\x20SESSIONS/)
        matches(text,/aaaaaa.*Coco\x20-\x20ocls/s)
        matches(text,/ARE\x20YOU\x20SURE\?\x20\(yN\)/)
    })
    await section("the warning comes before the session list", async function ()
    {
        res = run(['aaaaaa'])
        text = res.text
        compare(text.indexOf('DELETE SESSIONS') < text.indexOf('aaaaaa'),true)
        compare(text.indexOf('aaaaaa') < text.indexOf('ARE YOU SURE'),true)
    })
    await section("n aborts without deleting", async function ()
    {
        res = run(['aaaaaa'],'n')
        compare(res.deleted,[])
        matches(res.text,/nothing\x20deleted/i)
    })
    await section("empty input aborts", async function ()
    {
        empty = run(['aaaaaa'],'').deleted
        compare(empty,[])
    })
    await section("anything other than y aborts", async function ()
    {
        maybe = run(['aaaaaa'],'maybe').deleted
        compare(maybe,[])
    })
    await section("yes is accepted too", async function ()
    {
        agreed = run(['aaaaaa'],'yes').deleted
        compare(agreed.length,1)
    })
}
toExport["del confirmation"]._section_ = true
toExport["del deletion"] = async function ()
{
    await section("accepts a title argument and deletes what it matched", async function ()
    {
        withDb(function (database)
        {
            del({db:database,prefixes:['ocls'],width:80,style:plain,io:io('y')})
            compare(rowCount(database,A),0)
            return compare(rowCount(database,C),1)
        })
    })
    await section("accepts a mix of ids and titles", async function ()
    {
        withDb(function (database)
        {
            var both

            both = ['aaaaaaa','ocls']
            del({db:database,prefixes:both,width:80,style:plain,io:io('y')})
            return compare(rowCount(database,A),0)
        })
    })
    await section("removes the session row", async function ()
    {
        withDb(function (database)
        {
            deleteA(database)
            return compare(rowCount(database,A),0)
        })
    })
    await section("cascades to all five child tables", async function ()
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
    await section("leaves other sessions and their children alone", async function ()
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
    await section("reports what it deleted, in the ids given", async function ()
    {
        both = run(['aaaaaa','cccccc']).deleted
        compare(both,[A,C])
    })
    await section("an aborted delete leaves the rows untouched", async function ()
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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsLmpzIiwic291cmNlcyI6WyIuLi8uLi9rb2RlL3Rlc3QvZGVsLmtvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQVlBLFFBQVEsTUFBTSxZQUFZO0FBRTFCLElBQUk7QUFDSixJQUFJOztBQUlKOzs7O0lBRUk7SUFDQSxVQUFVLE9BQU8sTUFBTTtJQUV2Qjs7ZUFBa0IsSUFBSSxLQUFLOztJQUMzQjs7WUFBbUIsUUFBUTs7bUJBQVksUUFBUTs7OzttQkFBYTs7O0lBRTVEOztlQUFZLElBQUksS0FBSzs7WUFFckIsWUFBYSxZQUNiLE1BQU8sTUFDUCxXQUFZLFdBQ1osT0FBUTs7O0FBTVo7Ozs7SUFFSSxXQUFXLEdBQUc7SUFDZCxXQUFXLEdBQUcsYUFBYSxNQUFNOzs7UUFHN0IsTUFBTSxLQUFLLEdBQUksU0FBVSxTQUFVLElBQUssTUFBQSxNQUFPLE1BQU8sTUFBTyxHQUFJO1FBQ2pFLE9BQU0sUUFBUyxJQUFJLFFBQVMsS0FBTSxTQUFTOztXQUN6Qzs7UUFDRixTQUFTO1FBQ1QsTUFBTTs7SUFFVixTQUFTO1dBQ1Q7OztBQUVKOzs7O0lBRUksV0FBVyxHQUFHLGFBQWEsTUFBTTs7O1FBRzdCLE1BQU0sR0FBRzs7V0FDUDs7UUFDRixTQUFTO1FBQ1QsTUFBTTs7SUFFVixTQUFTO1dBQ1Q7OztBQUVKOztXQUNJLEtBQUssR0FBSSxTQUFVLFVBQVcsVUFBVyxNQUFPLEdBQUksTUFBTyxNQUFPLEdBQUksR0FBRzs7O0FBRTdFOztXQUNJLFNBQVMsUUFBUSxxREFBcUQsSUFBSSxJQUFJOzs7QUFLbEY7Ozs7ZUFBaUMsYUFBYSxHQUFHLGNBQWUsUUFBUSxLQUFLLEVBQUU7Ozs7QUFNL0U7O1dBQWdCLGFBQWEsR0FBRzs7Ozs7O1FBTXhCOztZQUNJLFNBQVMsUUFBUSx1Q0FBdUMsSUFBSTsyQkFDNUQsU0FBUyxTQUFVLEdBQUs7Ozs7O1FBSTVCOzs7O1lBQ0ksU0FBUyxTQUFTLFFBQVEsdUJBQXVCOzJCQUNqRCxPQUFPLGFBQWU7Ozs7O1FBSTFCOzttQkFBVyxHQUFHLGFBQWE7V0FBOEI7Ozs7Ozs7O1FBTXpEOzttQkFBVztXQUFVLFdBQVc7Ozs7b0JBSWxCLElBQUk7Ozs7WUFDZCxVQUFVLFdBQVc7WUFLckI7O3VCQUFXLEtBQUs7ZUFBVTs7Ozs7UUFJOUIsWUFBWSxLQUFLLE9BQU87UUFFeEI7Ozs7b0JBQWUsRUFBRSxvQkFBYSxFQUFFLFFBQVEsU0FBUyxTQUFVLEVBQUUsUUFBUSxTQUFTOztRQUU5RTs7bUJBQVcsSUFBSTtXQUFZOzs7O1FBSTNCOztZQUNJLFNBQVMsR0FBSSxTQUFVLFVBQVcsTUFBTyxNQUFPLEdBQUksTUFBTyxNQUFPLEdBQUksR0FBRztZQUV6RTs7dUJBQVUsSUFBSTs7MkJBQ2QsU0FBUyxTQUFVLEdBQUs7Ozs7O1FBSTVCLE1BQU0sS0FBSyxPQUFRLEtBQUs7Z0JBQ3hCLEtBQU87Ozs7UUFJUDs7bUJBQVcsS0FBSztXQUFhOzs7O1FBSTdCOzs7O1lBQ0ksT0FBTyxHQUFJLFNBQVUsVUFBVyxVQUFXLE1BQU8sR0FBSSxNQUFPLE1BQU8sR0FBSSxHQUFHLElBQUs7bUJBRWhGOzt1QkFBVyxJQUFJO2VBQU8sV0FBVzs7Ozs7Ozs7O1FBWXJDLE1BQU0sS0FBSztRQUNYLE9BQU8sSUFBSTtRQUVYLFFBQVEsS0FBTTtRQUNkLFFBQVEsS0FBTTtRQUNkLFFBQVEsS0FBTTs7OztRQUlkLE1BQU0sS0FBSztRQUNYLE9BQU8sSUFBSTtnQkFFWCxLQUFLLFFBQVEscUJBQXFCLEtBQUssUUFBUSxVQUFZO2dCQUMzRCxLQUFLLFFBQVEsWUFBWSxLQUFLLFFBQVEsZ0JBQWtCOzs7O1FBSXhELE1BQU0sS0FBSyxVQUFXO2dCQUV0QixJQUFJO1FBQ0osUUFBUSxJQUFJLEtBQU07Ozs7UUFJbEIsUUFBUSxLQUFLLFVBQVcsSUFBSTtnQkFDNUI7Ozs7UUFJQSxRQUFRLEtBQUssVUFBVyxTQUFTO2dCQUNqQzs7OztRQUlBLFNBQVMsS0FBSyxVQUFXLE9BQU87Z0JBQ2hDLE9BQU8sT0FBUzs7Ozs7Ozs7UUFZaEI7O1lBQ0ksS0FBSyxHQUFJLFNBQVUsVUFBVyxRQUFTLE1BQU8sR0FBSSxNQUFPLE1BQU8sR0FBSSxHQUFHO29CQUN2RSxTQUFTLFNBQVUsR0FBSzsyQkFDeEIsU0FBUyxTQUFVLEdBQUs7Ozs7O1FBSTVCOzs7O1lBQ0ksUUFBUSxVQUFVO1lBQ2xCLEtBQUssR0FBSSxTQUFVLFNBQVUsS0FBTSxNQUFPLEdBQUksTUFBTyxNQUFPLEdBQUksR0FBRzsyQkFDbkUsU0FBUyxTQUFVLEdBQUs7Ozs7O1FBSTVCOztZQUNJLFFBQVE7MkJBQ1IsU0FBUyxTQUFVLEdBQUs7Ozs7O1FBSTVCOzs7O1lBRUksU0FBUyxNQUFNLFVBQVUsU0FBVTtZQUVuQyxRQUFRLE9BQU8sT0FBTztvQkFDdEIsTUFBTTs7dUJBQWEsSUFBSTtlQUFLO1lBRTVCLFFBQVE7aUNBRUssT0FBTyxRQUFRLE1BQU0sVUFBVSxTQUFVOzs7O3dCQUNsRCxNQUFNLEdBQUs7Ozs7OztRQUluQjs7OztZQUNJLFFBQVE7b0JBQ1IsU0FBUyxTQUFVLEdBQUs7WUFDeEIsU0FBUyxPQUFPLE9BQU8sTUFBTSxVQUFVLFNBQVU7MkJBQ2pELE9BQU87O3VCQUFhLElBQUk7ZUFBSzs7Ozs7UUFJakMsT0FBTyxLQUFLLFNBQVUsV0FBVztnQkFDakMsTUFBUSxFQUFHOzs7O1FBSVg7O1lBQ0ksUUFBUSxTQUFVOzJCQUNsQixTQUFTLFNBQVUsR0FBSyJ9
//# sourceURL=file://kode/test/del.kode
