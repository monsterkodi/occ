var A, addSession, attempt, B, GONE, withDb

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "./fixtures/build.js"

import db from "../db.js"

import resume from "../resume.js"

A = 'ses_aaaaaaaaaaaaaaaaaaaaaaaaa1'
B = 'ses_bbbbbbbbbbbbbbbbbbbbbbb2'
GONE = 'ses_9999999999999999999999g'

withDb = function (fn)
{
    var database, out

    database = db.openDb(build.buildTestDb())
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

addSession = function (database, id, directory, title)
{
    var stmt

    stmt = database.prepare("INSERT INTO session_v2 (id, project_id, parent_id, title, slug, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    return stmt.run(id,'proj1',null,title,'quiet-fox',directory,1,2)
}

attempt = function (prefixes, opt = {})
{
    var code, launch, plans

    plans = []
    launch = function (plan)
    {
        var _50_17_

        plans.push(plan)
        return ((_50_17_=opt.code) != null ? _50_17_ : 0)
    }
    code = async function ()
    {
        return withDb(function (database)
        {
            var _56_45_

            return resume.resume({db:database,prefixes:prefixes,io:{interactive:((_56_45_=opt.interactive) != null ? _56_45_ : true)},launch:launch})
        })
    }
    return {plans:plans,code:code}
}
test.describe('personaOf',function ()
{
    test('the directory basename is the persona',function ()
    {
        assert.equal(resume.personaOf('/home/kodi/a/coco'),'coco')
        return assert.equal(resume.personaOf('/home/kodi/a/bert'),'bert')
    })
    test('a dot directory can name a persona of its own',function ()
    {
        return assert.equal(resume.personaOf('/home/kodi/.config'),'sepp')
    })
    test('the persona is lowercased',function ()
    {
        return assert.equal(resume.personaOf('/home/kodi/A/Coco'),'coco')
    })
    return test('a trailing slash does not matter',function ()
    {
        return assert.equal(resume.personaOf('/home/kodi/a/coco/'),'coco')
    })
})
test.describe('resume guards',function ()
{
    test('no session at all is refused',async function ()
    {
        var run

        run = attempt([])
        return await assert.rejects(run.code(),function (e)
        {
            return e instanceof db.OclsError && (/exactly\x20one\x20session\x20id/i).test(e.message)
        })
    })
    test('two sessions are refused',async function ()
    {
        var run

        run = attempt(['aaaaaa','cccccc'])
        return await assert.rejects(run.code(),function (e)
        {
            return e instanceof db.OclsError && (/got\x202/).test(e.message)
        })
    })
    test('a fragment matching several sessions is refused',async function ()
    {
        var run

        run = attempt(['o'])
        return await assert.rejects(run.code(),function (e)
        {
            return e instanceof db.OclsError && (/matches\x202\x20sessions/).test(e.message)
        })
    })
    test('the refusal names the fragment and the count',async function ()
    {
        var run

        run = attempt(['o'])
        return await assert.rejects(run.code(),/"o".*2/)
    })
    test('an unknown session is refused',async function ()
    {
        var run

        run = attempt(['zzzzzz'])
        return await assert.rejects(run.code(),/no\x20session\x20matches/)
    })
    test('a non-interactive terminal is refused',async function ()
    {
        var run

        run = attempt(['aaaaaa'],{interactive:false})
        return await assert.rejects(run.code(),function (e)
        {
            return e instanceof db.OclsError && (/terminal/i).test(e.message)
        })
    })
    test('a session whose directory is gone is refused',async function ()
    {
        var database, plans, refused

        plans = []
        database = db.openWritable(build.buildTestDb())
        addSession(database,GONE,'/nonexistent/persona','Gone - nothing')
        refused = function ()
        {
            return resume.resume({db:database,prefixes:[GONE],io:{interactive:true},launch:function (plan)
            {
                return plans.push(plan)
            }})
        }
        try
        {
            await assert.rejects(refused(),function (e)
            {
                return e instanceof db.OclsError && e.message.includes('/nonexistent/persona')
            })
        }
        catch (err)
        {
            throw err
        }
        finally
        {
            database.close()
        }
        return assert.deepEqual(plans,[])
    })
    return test('nothing is launched when a guard fires',async function ()
    {
        var joined, prefixes, run

        var list = [[],['aaaaaa','cccccc'],['o'],['zzzzzz']]
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            prefixes = list[_a_]
            run = attempt(prefixes)
            await assert.rejects(run.code())
            joined = prefixes.join(' ')
            assert.deepEqual(run.plans,[],`${joined} launched something`)
        }
    })
})
test.describe('resume plan',function ()
{
    test('runs opencode on the session',async function ()
    {
        var code, got, plans, run

        run = attempt(['aaaaaa'])
        plans = run.plans
        code = run.code
        got = await code()
        assert.equal(got,0)
        assert.equal(plans.length,1)
        return assert.equal(plans[0].command,'opencode')
    })
    test('passes the full session id, never the prefix',async function ()
    {
        var code, plans, run

        run = attempt(['aaaaaa'])
        plans = run.plans
        code = run.code
        await code()
        return assert.deepEqual(plans[0].args,['--session',A])
    })
    test('runs in the directory the session belongs to',async function ()
    {
        var code, plans, run

        run = attempt(['aaaaaa'])
        plans = run.plans
        code = run.code
        await code()
        return assert.equal(plans[0].cwd,'/home/kodi/a/coco')
    })
    test('sets the persona the session runs as',async function ()
    {
        var code, plans, run

        run = attempt(['aaaaaa'])
        plans = run.plans
        code = run.code
        await code()
        return assert.equal(plans[0].env.OPENCODE_PERSONA,'coco')
    })
    test('a title fragment resolves the same way',async function ()
    {
        var code, plans, run

        run = attempt(['ocls'])
        plans = run.plans
        code = run.code
        await code()
        assert.deepEqual(plans[0].args,['--session',A])
        return assert.equal(plans[0].cwd,'/home/kodi/a/coco')
    })
    test('a session in .config resumes as sepp',async function ()
    {
        var code, plans, run

        run = attempt(['bbbbbbb'])
        plans = run.plans
        code = run.code
        await code()
        assert.deepEqual(plans[0].args,['--session',B])
        assert.equal(plans[0].cwd,'/home/kodi/.config')
        return assert.equal(plans[0].env.OPENCODE_PERSONA,'sepp')
    })
    test('the rest of the environment is inherited',async function ()
    {
        var code, plans, run

        run = attempt(['aaaaaa'])
        plans = run.plans
        code = run.code
        await code()
        return assert.equal(plans[0].env.PATH,process.env.PATH)
    })
    return test('returns the exit code opencode exited with',async function ()
    {
        var got, run

        run = attempt(['aaaaaa'],{code:42})
        got = await run.code()
        return assert.equal(got,42)
    })
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdW1lLnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9yZXN1bWUudGVzdC5rb2RlIl0sIm1hcHBpbmdzIjoiOztPQVFPLEtBQUssS0FBSztPQUNWLE9BQU8sS0FBSzs7Ozs7OztBQU1uQixJQUFJO0FBQ0osSUFBSTtBQUVKLE9BQU87O0FBRVA7Ozs7SUFFSSxXQUFXLEdBQUcsT0FBTyxNQUFNOzs7UUFHdkIsTUFBTSxHQUFHOztXQUNQOztRQUNGLFNBQVM7UUFDVCxNQUFNOztJQUVWLFNBQVM7V0FDVDs7O0FBRUo7Ozs7SUFFSSxPQUFPLFNBQVMsUUFBUTtXQUN4QixLQUFLLElBQUksR0FBSSxRQUFTLEtBQU0sTUFBTyxZQUFhLFVBQVcsRUFBRzs7O0FBUWxFOzs7O0lBRUk7SUFDQTs7OztRQUNJLE1BQU0sS0FBSzt5QkFDWCxJQUFJLDBCQUFPOztJQUVmOztlQUFXOzs7O21CQUNQLE9BQU8sUUFDSCxHQUFJLFNBQ0osU0FBVSxTQUNWLElBQUksc0JBQWEsSUFBSSxpQ0FBYyxPQUNuQyxPQUFROzs7WUFFaEIsTUFBTyxNQUNQLEtBQU07O0FBUVYsS0FBSyxTQUFTOztJQUVWLEtBQUs7O1FBRUQsT0FBTyxNQUFNLE9BQU8sVUFBVSxxQkFBc0I7ZUFDcEQsT0FBTyxNQUFNLE9BQU8sVUFBVSxxQkFBc0I7O0lBRXhELEtBQUs7O2VBRUQsT0FBTyxNQUFNLE9BQU8sVUFBVSxzQkFBdUI7O0lBRXpELEtBQUs7O2VBRUQsT0FBTyxNQUFNLE9BQU8sVUFBVSxxQkFBc0I7O1dBRXhELEtBQUs7O2VBRUQsT0FBTyxNQUFNLE9BQU8sVUFBVSxzQkFBdUI7OztBQVM3RCxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7OztRQUVELE1BQU07cUJBQ0EsT0FBTyxRQUFRLElBQUk7O21CQUNyQixhQUFhLEdBQUcsY0FBZSxvQ0FBb0MsS0FBSyxFQUFFOzs7SUFFbEYsS0FBSzs7OztRQUVELE1BQU0sU0FBUyxTQUFVO3FCQUNuQixPQUFPLFFBQVEsSUFBSTs7bUJBQ3JC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
//# sourceURL=file://kode/test/resume.test.kode
