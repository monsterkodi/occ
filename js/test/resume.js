var toExport = {}
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var A, addSession, attempt, attempted, B, directory, dotConfig, exitCode, fragment, fullId, GONE, goneDatabase, gonePlans, goneRes, guard, guardRuns, inherited, named, noId, noTerminal, one, onSession, persona, prefixes, refused, title, twoIds, unknown, withDb

import build from "./fixtures/build.js"

import db from "../db.js"

import resume from "../resume.js"

import helpers from "./helpers.js"
let catching = helpers.catching

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
        var _59_17_

        plans.push(plan)
        return ((_59_17_=opt.code) != null ? _59_17_ : 0)
    }
    code = async function ()
    {
        return withDb(function (database)
        {
            var _65_45_

            return resume.resume({db:database,prefixes:prefixes,io:{interactive:((_65_45_=opt.interactive) != null ? _65_45_ : true)},launch:launch})
        })
    }
    return {plans:plans,code:code}
}

attempted = async function (prefixes, opt = {})
{
    var res, run

    run = attempt(prefixes,opt)
    res = await catching(run.code)
    return {plans:run.plans,res:res}
}
noId = await attempted([])
twoIds = await attempted(['aaaaaa','cccccc'])
fragment = await attempted(['o'])
named = await attempted(['o'])
unknown = await attempted(['zzzzzz'])
noTerminal = await attempted(['aaaaaa'],{interactive:false})
guardRuns = []
var list = [[],['aaaaaa','cccccc'],['o'],['zzzzzz']]
for (var _a_ = 0; _a_ < list.length; _a_++)
{
    prefixes = list[_a_]
    one = await attempted(prefixes)
    guardRuns.push(one)
}
gonePlans = []
goneDatabase = db.openWritable(build.buildTestDb())
addSession(goneDatabase,GONE,'/nonexistent/persona','Gone - nothing')

refused = function ()
{
    return resume.resume({db:goneDatabase,prefixes:[GONE],io:{interactive:true},launch:function (plan)
    {
        return gonePlans.push(plan)
    }})
}
goneRes = await catching(refused)
goneDatabase.close()
onSession = await attempted(['aaaaaa'])
fullId = await attempted(['aaaaaa'])
directory = await attempted(['aaaaaa'])
persona = await attempted(['aaaaaa'])
title = await attempted(['ocls'])
dotConfig = await attempted(['bbbbbbb'])
inherited = await attempted(['aaaaaa'])
exitCode = await attempted(['aaaaaa'],{code:42})
toExport["personaOf"] = function ()
{
    section("the directory basename is the persona", function ()
    {
        compare(resume.personaOf('/home/kodi/a/coco'),'coco')
        compare(resume.personaOf('/home/kodi/a/bert'),'bert')
    })
    section("a dot directory can name a persona of its own", function ()
    {
        compare(resume.personaOf('/home/kodi/.config'),'sepp')
    })
    section("the persona is lowercased", function ()
    {
        compare(resume.personaOf('/home/kodi/A/Coco'),'coco')
    })
    section("a trailing slash does not matter", function ()
    {
        compare(resume.personaOf('/home/kodi/a/coco/'),'coco')
    })
}
toExport["personaOf"]._section_ = true
toExport["resume guards"] = function ()
{
    section("no session at all is refused", function ()
    {
        compare(noId.res.error,function (e)
        {
            return e instanceof db.OclsError && (/exactly\x20one\x20session\x20id/i).test(e.message)
        })
    })
    section("two sessions are refused", function ()
    {
        compare(twoIds.res.error,function (e)
        {
            return e instanceof db.OclsError && (/got\x202/).test(e.message)
        })
    })
    section("a fragment matching several sessions is refused", function ()
    {
        compare(fragment.res.error,function (e)
        {
            return e instanceof db.OclsError && (/matches\x202\x20sessions/).test(e.message)
        })
    })
    section("the refusal names the fragment and the count", function ()
    {
        compare(named.res.error,function (e)
        {
            return (/"o".*2/).test(e.message)
        })
    })
    section("an unknown session is refused", function ()
    {
        compare(unknown.res.error,function (e)
        {
            return (/no\x20session\x20matches/).test(e.message)
        })
    })
    section("a non-interactive terminal is refused", function ()
    {
        compare(noTerminal.res.error,function (e)
        {
            return e instanceof db.OclsError && (/terminal/i).test(e.message)
        })
    })
    section("a session whose directory is gone is refused", function ()
    {
        compare(goneRes.error,function (e)
        {
            return e instanceof db.OclsError && e.message.includes('/nonexistent/persona')
        })
        compare(gonePlans,[])
    })
    section("nothing is launched when a guard fires", function ()
    {
        var list1 = _k_.list(guardRuns)
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            guard = list1[_b_]
            compare((guard.res.error !== null),true)
            compare(guard.plans,[])
        }
    })
}
toExport["resume guards"]._section_ = true
toExport["resume plan"] = function ()
{
    section("runs opencode on the session", function ()
    {
        compare(onSession.res.error,null)
        compare(onSession.res.value,0)
        compare(onSession.plans.length,1)
        compare(onSession.plans[0].command,'opencode')
    })
    section("passes the full session id, never the prefix", function ()
    {
        compare(fullId.res.error,null)
        compare(fullId.plans[0].args,['--session',A])
    })
    section("runs in the directory the session belongs to", function ()
    {
        compare(directory.res.error,null)
        compare(directory.plans[0].cwd,'/home/kodi/a/coco')
    })
    section("sets the persona the session runs as", function ()
    {
        compare(persona.res.error,null)
        compare(persona.plans[0].env.OPENCODE_PERSONA,'coco')
    })
    section("a title fragment resolves the same way", function ()
    {
        compare(title.res.error,null)
        compare(title.plans[0].args,['--session',A])
        compare(title.plans[0].cwd,'/home/kodi/a/coco')
    })
    section("a session in .config resumes as sepp", function ()
    {
        compare(dotConfig.res.error,null)
        compare(dotConfig.plans[0].args,['--session',B])
        compare(dotConfig.plans[0].cwd,'/home/kodi/.config')
        compare(dotConfig.plans[0].env.OPENCODE_PERSONA,'sepp')
    })
    section("the rest of the environment is inherited", function ()
    {
        compare(inherited.res.error,null)
        compare(inherited.plans[0].env.PATH,process.env.PATH)
    })
    section("returns the exit code opencode exited with", function ()
    {
        compare(exitCode.res.error,null)
        compare(exitCode.res.value,42)
    })
}
toExport["resume plan"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdW1lLmpzIiwic291cmNlcyI6WyIuLi8uLi9rb2RlL3Rlc3QvcmVzdW1lLmtvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBd0JBLElBQUk7QUFDSixJQUFJO0FBRUosT0FBTzs7QUFFUDs7OztJQUVJLFdBQVcsR0FBRyxPQUFPLE1BQU07OztRQUd2QixNQUFNLEdBQUc7O1dBQ1A7O1FBQ0YsU0FBUztRQUNULE1BQU07O0lBRVYsU0FBUztXQUNUOzs7QUFFSjs7OztJQUVJLE9BQU8sU0FBUyxRQUFRO1dBQ3hCLEtBQUssSUFBSSxHQUFJLFFBQVMsS0FBTSxNQUFPLFlBQWEsVUFBVyxFQUFHOzs7QUFRbEU7Ozs7SUFFSTtJQUNBOzs7O1FBQ0ksTUFBTSxLQUFLO3lCQUNYLElBQUksMEJBQU87O0lBRWY7O2VBQVc7Ozs7bUJBQ1AsT0FBTyxRQUNILEdBQUksU0FDSixTQUFVLFNBQ1YsSUFBSSxzQkFBYSxJQUFJLGlDQUFjLE9BQ25DLE9BQVE7OztZQUVoQixNQUFPLE1BQ1AsS0FBTTs7O0FBS1Y7Ozs7SUFFSSxNQUFNLFFBQVEsU0FBVTtJQUN4QixZQUFRLFNBQVMsSUFBSTtZQUVyQixNQUFPLElBQUksTUFDWCxJQUFLOztBQUVULGFBQWdCO0FBQ2hCLGVBQWdCLFdBQVcsU0FBVTtBQUNyQyxpQkFBZ0IsV0FBVztBQUMzQixjQUFnQixXQUFXO0FBQzNCLGdCQUFnQixXQUFXO0FBQzNCLG1CQUFnQixXQUFXLFdBQVksWUFBYTtBQUlwRDtnQkFFcUIsU0FBUyxXQUFXLE1BQU07Ozs7SUFDM0MsWUFBUSxVQUFVO0lBQ2xCLFVBQVUsS0FBSzs7QUFJbkI7QUFDQSxlQUFlLEdBQUcsYUFBYSxNQUFNO0FBRXJDLFdBQVcsYUFBYyxLQUFNLHVCQUF3Qjs7QUFFdkQ7O1dBQWEsT0FBTyxRQUNoQixHQUFJLGFBQ0osVUFBVyxNQUNYLElBQUssWUFBYSxNQUNsQjs7ZUFBa0IsVUFBVSxLQUFLOzs7QUFFckMsZ0JBQVksU0FBUztBQUNyQixhQUFhO0FBRWIsa0JBQWMsV0FBVztBQUN6QixlQUFjLFdBQVc7QUFDekIsa0JBQWMsV0FBVztBQUN6QixnQkFBYyxXQUFXO0FBQ3pCLGNBQWMsV0FBVztBQUN6QixrQkFBYyxXQUFXO0FBQ3pCLGtCQUFjLFdBQVc7QUFDekIsaUJBQWMsV0FBVyxXQUFZLEtBQU07Ozs7O2dCQU1uQyxPQUFPLFVBQVUscUJBQXVCO2dCQUN4QyxPQUFPLFVBQVUscUJBQXdCOzs7O2dCQUl6QyxPQUFPLFVBQVUsc0JBQXdCOzs7O2dCQUl6QyxPQUFPLFVBQVUscUJBQXVCOzs7O2dCQUl4QyxPQUFPLFVBQVUsc0JBQXdCOzs7Ozs7OztnQkFZekMsS0FBSyxJQUFJOzttQkFBZSxhQUFhLEdBQUcsY0FBZSxvQ0FBb0MsS0FBSyxFQUFFOzs7OztnQkFJbEcsT0FBTyxJQUFJOzttQkFBZSxhQUFhLEdBQUcsY0FBZSxZQUFZLEtBQUssRUFBRTs7Ozs7Z0JBSTVFLFNBQVMsSUFBSTs7bUJBQWUsYUFBYSxHQUFHLGNBQWUsNEJBQTRCLEtBQUssRUFBRTs7Ozs7Z0JBSTlGLE1BQU0sSUFBSTs7b0JBQWdCLFVBQVUsS0FBSyxFQUFFOzs7OztnQkFJM0MsUUFBUSxJQUFJOztvQkFBZ0IsNEJBQTRCLEtBQUssRUFBRTs7Ozs7Z0JBSS9ELFdBQVcsSUFBSTs7bUJBQWUsYUFBYSxHQUFHLGNBQWUsYUFBYSxLQUFLLEVBQUU7Ozs7O2dCQUlqRixRQUFROzttQkFBZSxhQUFhLEdBQUcsYUFBYyxFQUFFLFFBQVEsU0FBUzs7Z0JBQ3hFOzs7OzZCQUlhOzs7O3FCQUNSLE1BQU0sSUFBSSxVQUFTLE1BQVE7b0JBQzVCLE1BQU07Ozs7Ozs7OztnQkFZVixVQUFVLElBQUksTUFBUTtnQkFDdEIsVUFBVSxJQUFJLE1BQVE7Z0JBQ3RCLFVBQVUsTUFBTSxPQUFTO2dCQUN6QixVQUFVLE1BQU0sR0FBRyxRQUFVOzs7O2dCQUk3QixPQUFPLElBQUksTUFBUTtnQkFDbkIsT0FBTyxNQUFNLEdBQUcsTUFBUSxZQUFhOzs7O2dCQUlyQyxVQUFVLElBQUksTUFBUTtnQkFDdEIsVUFBVSxNQUFNLEdBQUcsSUFBTTs7OztnQkFJekIsUUFBUSxJQUFJLE1BQVE7Z0JBQ3BCLFFBQVEsTUFBTSxHQUFHLElBQUksaUJBQW1COzs7O2dCQUl4QyxNQUFNLElBQUksTUFBUTtnQkFDbEIsTUFBTSxNQUFNLEdBQUcsTUFBUSxZQUFhO2dCQUNwQyxNQUFNLE1BQU0sR0FBRyxJQUFNOzs7O2dCQUlyQixVQUFVLElBQUksTUFBUTtnQkFDdEIsVUFBVSxNQUFNLEdBQUcsTUFBUSxZQUFhO2dCQUN4QyxVQUFVLE1BQU0sR0FBRyxJQUFNO2dCQUN6QixVQUFVLE1BQU0sR0FBRyxJQUFJLGlCQUFtQjs7OztnQkFJMUMsVUFBVSxJQUFJLE1BQVE7Z0JBQ3RCLFVBQVUsTUFBTSxHQUFHLElBQUksS0FBTyxRQUFRLElBQUk7Ozs7Z0JBSTFDLFNBQVMsSUFBSSxNQUFRO2dCQUNyQixTQUFTLElBQUksTUFBUSJ9
//# sourceURL=file://kode/test/resume.kode
