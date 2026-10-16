var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var here, home, LISTED, occ, occRun, READ_COMMANDS, rejectsWith, root, run

import test from 'node:test'
import assert from 'node:assert/strict'
import child from 'node:child_process'
import util from 'node:util'
import path from 'node:path'
import url from 'node:url'
import build from "./fixtures/build.js"

run = util.promisify(child.execFile)
here = url.fileURLToPath(import.meta.url)
root = path.join(path.dirname(here),'..','..')
occ = path.join(root,'bin/occ')
home = build.makeDataHome().home
READ_COMMANDS = ['ls','cat','log','shell']
LISTED = /^\x20+occ\x20(\w+)/gm

occRun = function (args, env = {})
{
    var all, base, envs

    all = [occ].concat(args)
    base = {XDG_DATA_HOME:home,NO_COLOR:'1'}
    envs = Object.assign({},process.env,base,env)
    return run(process.execPath,all,{env:envs})
}

rejectsWith = function (pattern)
{
    return function (e)
    {
        assert.equal(e.code,1)
        assert.match(e.stderr,pattern)
        return true
    }
}
test.describe('cli read commands',async function ()
{
    var command

    var list = _k_.list(READ_COMMANDS)
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        command = list[_a_]
        test(`${command} runs and prints something`,async function ()
        {
            var res

            res = await occRun([command,'aaaaaa'])
            return assert.match(res.stdout,/aaaaaa/)
        })
        test(`${command} with no ids runs`,async function ()
        {
            var res

            res = await occRun([command])
            return assert.ok(res.stdout.trim().length > 0)
        })
    }
    test('every command in the help table is dispatchable',async function ()
    {
        var listed, matches, out, res, skip

        res = await occRun(['--help'])
        matches = res.stdout.matchAll(LISTED)
        listed = Array.from(matches).map(function (m)
        {
            return m[1]
        })
        assert.ok(listed.includes,'ls')
        skip = ['del','resume']
        var list1 = _k_.list(listed.filter(function (c)
        {
            return !skip.includes(c)
        }))
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            command = list1[_b_]
            res = await occRun([command,'aaaaaa'])
            out = res.stdout
            assert.ok(out.trim().length > 0,`${command} printed nothing`)
        }
    })
    test('a title argument works end to end',async function ()
    {
        var res

        res = await occRun(['ls','ocls'])
        assert.match(res.stdout,/aaaaaa/)
        return assert.match(res.stdout,/Coco\x20-\x20ocls/)
    })
    return test('every read command accepts a title argument',async function ()
    {
        var res

        var list1 = _k_.list(READ_COMMANDS)
        for (var _c_ = 0; _c_ < list1.length; _c_++)
        {
            command = list1[_c_]
            res = await occRun([command,'ocls'])
            assert.match(res.stdout,/aaaaaa/,`${command} did not resolve a title`)
        }
    })
})
test.describe('cli help',async function ()
{
    test('no arguments falls back to ls',async function ()
    {
        var bare, listed

        bare = await occRun([])
        listed = await occRun(['ls'])
        assert.equal(bare.stdout,listed.stdout)
        return assert.doesNotMatch(bare.stdout,/usage:/)
    })
    test('an empty argument is still a command lookup',async function ()
    {
        return await assert.rejects(occRun(['']),rejectsWith(/unknown\x20command/))
    })
    return test('an unknown command fails with a message',async function ()
    {
        return await assert.rejects(occRun(['frobnicate']),rejectsWith(/unknown\x20command\x20\"frobnicate\"/))
    })
})
test.describe('cli del',async function ()
{
    test('is dispatched and reaches its own guard',async function ()
    {
        return await assert.rejects(occRun(['del']),rejectsWith(/at\x20least\x20one\x20session\x20id/))
    })
    return test('refuses without a terminal',async function ()
    {
        return await assert.rejects(occRun(['del','aaaaaa']),rejectsWith(/needs\x20a\x20terminal/))
    })
})
test.describe('cli resume',async function ()
{
    test('is dispatched and reaches its own guard',async function ()
    {
        return await assert.rejects(occRun(['resume']),rejectsWith(/exactly\x20one\x20session\x20id/))
    })
    return test('refuses without a terminal',async function ()
    {
        return await assert.rejects(occRun(['resume','aaaaaa']),rejectsWith(/needs\x20a\x20terminal/))
    })
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9jbGkudGVzdC5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7O09BUU8sS0FBSyxLQUFLO09BQ1YsT0FBTyxLQUFLO09BRVosTUFBTSxLQUFLO09BQ1gsS0FBSyxLQUFLO09BQ1YsS0FBSyxLQUFLO09BQ1YsSUFBSSxLQUFLOzs7QUFJaEIsTUFBTSxLQUFLLFVBQVUsTUFBTTtBQUszQixPQUFPLElBQUksY0FBYyxPQUFPLEtBQUs7QUFFckMsT0FBTyxLQUFLLEtBQUssS0FBSyxRQUFRLE1BQU8sS0FBTTtBQUUzQyxNQUFNLEtBQUssS0FBSyxLQUFNO0FBRXRCLE9BQU8sTUFBTSxlQUFlO0FBRTVCLGlCQUFpQixLQUFLLE1BQU0sTUFBTTtBQUlsQyxTQUFTOztBQUVUOzs7O0lBS0ksT0FBTyxLQUFLLE9BQU87SUFDbkIsUUFBUSxjQUFlLEtBQU0sU0FBVTtJQUN2QyxPQUFPLE9BQU8sVUFBVyxRQUFRLElBQUssS0FBTTtXQUU1QyxJQUFJLFFBQVEsU0FBVSxLQUFNLElBQUs7OztBQUlyQzs7OztRQUVJLE9BQU8sTUFBTSxFQUFFLEtBQU07UUFDckIsT0FBTyxNQUFNLEVBQUUsT0FBUTtlQUN2Qjs7O0FBR0osS0FBSyxTQUFTOzs7O3dCQUVLOzs7O1FBRVgsUUFBUTs7OztZQUVKLFlBQU8sUUFBUSxRQUFTO21CQUN4QixPQUFPLE1BQU0sSUFBSSxPQUFROztRQUU3QixRQUFROzs7O1lBRUosWUFBTyxRQUFRO21CQUNmLE9BQU8sR0FBRyxJQUFJLE9BQU8sT0FBTyxTQUFTOzs7SUFFN0MsS0FBSzs7OztRQUVELFlBQU8sUUFBUTtRQUtmLFVBQVUsSUFBSSxPQUFPLFNBQVM7UUFDOUIsU0FBUyxNQUFNLEtBQUssU0FBUzs7bUJBQVcsRUFBRTs7UUFFMUMsT0FBTyxHQUFHLE9BQU8sU0FBUztRQUUxQixRQUFRLE1BQU87NkJBRUEsT0FBTzs7b0JBQWtCLEtBQUssU0FBUzs7Ozs7WUFDbEQsWUFBTyxRQUFRLFFBQVM7WUFDeEIsTUFBTSxJQUFJO1lBQ1YsT0FBTyxHQUFHLElBQUksT0FBTyxTQUFTLEtBQU07OztJQUU1QyxLQUFLOzs7O1FBRUQsWUFBTyxRQUFRLEtBQU07UUFFckIsT0FBTyxNQUFNLElBQUksT0FBUTtlQUN6QixPQUFPLE1BQU0sSUFBSSxPQUFROztXQUU3QixLQUFLOzs7OzZCQUVjOzs7O1lBQ1gsWUFBTyxRQUFRLFFBQVM7WUFDeEIsT0FBTyxNQUFNLElBQUksT0FBUSxZQUFhOzs7O0FBRWxELEtBQUssU0FBUzs7SUFFVixLQUFLOzs7O1FBRUQsYUFBUTtRQUNSLGVBQVUsUUFBUTtRQUVsQixPQUFPLE1BQU0sS0FBSyxPQUFRLE9BQU87ZUFDakMsT0FBTyxhQUFhLEtBQUssT0FBUTs7SUFFckMsS0FBSzs7cUJBRUssT0FBTyxRQUFRLFFBQVEsS0FBTSxZQUFZOztXQUVuRCxLQUFLOztxQkFFSyxPQUFPLFFBQVEsUUFBUSxlQUFnQixZQUFZOzs7QUFFakUsS0FBSyxTQUFTOztJQUVWLEtBQUs7O3FCQUVLLE9BQU8sUUFBUSxRQUFRLFFBQVMsWUFBWTs7V0FFdEQsS0FBSzs7cUJBRUssT0FBTyxRQUFRLFFBQVEsTUFBTyxXQUFZLFlBQVk7OztBQUVwRSxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7cUJBRUssT0FBTyxRQUFRLFFBQVEsV0FBWSxZQUFZOztXQUV6RCxLQUFLOztxQkFFSyxPQUFPLFFBQVEsUUFBUSxTQUFVLFdBQVksWUFBWSJ9
//# sourceURL=file://kode/test/cli.test.kode
