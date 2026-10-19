var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var here, home, LISTED, occ, occRun, READ_COMMANDS, rejectsWith, root, run

import test from 'node:test'
import assert from 'node:assert/strict'
import child from 'node:child_process'
import util from 'node:util'
import path from 'node:path'
import url from 'node:url'
import build from "../test/fixtures/build.js"

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdF9vbGQvY2xpLnRlc3Qua29kZSJdLCJtYXBwaW5ncyI6Ijs7OztPQVFPLEtBQUssS0FBSztPQUNWLE9BQU8sS0FBSztPQUVaLE1BQU0sS0FBSztPQUNYLEtBQUssS0FBSztPQUNWLEtBQUssS0FBSztPQUNWLElBQUksS0FBSzs7O0FBSWhCLE1BQU0sS0FBSyxVQUFVLE1BQU07QUFLM0IsT0FBTyxJQUFJLGNBQWMsT0FBTyxLQUFLO0FBRXJDLE9BQU8sS0FBSyxLQUFLLEtBQUssUUFBUSxNQUFPLEtBQU07QUFFM0MsTUFBTSxLQUFLLEtBQUssS0FBTTtBQUV0QixPQUFPLE1BQU0sZUFBZTtBQUU1QixpQkFBaUIsS0FBSyxNQUFNLE1BQU07QUFJbEMsU0FBUzs7QUFFVDs7OztJQUtJLE9BQU8sS0FBSyxPQUFPO0lBQ25CLFFBQVEsY0FBZSxLQUFNLFNBQVU7SUFDdkMsT0FBTyxPQUFPLFVBQVcsUUFBUSxJQUFLLEtBQU07V0FFNUMsSUFBSSxRQUFRLFNBQVUsS0FBTSxJQUFLOzs7QUFJckM7Ozs7UUFFSSxPQUFPLE1BQU0sRUFBRSxLQUFNO1FBQ3JCLE9BQU8sTUFBTSxFQUFFLE9BQVE7ZUFDdkI7OztBQUdKLEtBQUssU0FBUzs7Ozt3QkFFSzs7OztRQUVYLFFBQVE7Ozs7WUFFSixZQUFPLFFBQVEsUUFBUzttQkFDeEIsT0FBTyxNQUFNLElBQUksT0FBUTs7UUFFN0IsUUFBUTs7OztZQUVKLFlBQU8sUUFBUTttQkFDZixPQUFPLEdBQUcsSUFBSSxPQUFPLE9BQU8sU0FBUzs7O0lBRTdDLEtBQUs7Ozs7UUFFRCxZQUFPLFFBQVE7UUFLZixVQUFVLElBQUksT0FBTyxTQUFTO1FBQzlCLFNBQVMsTUFBTSxLQUFLLFNBQVM7O21CQUFXLEVBQUU7O1FBRTFDLE9BQU8sR0FBRyxPQUFPLFNBQVM7UUFFMUIsUUFBUSxNQUFPOzZCQUVBLE9BQU87O29CQUFrQixLQUFLLFNBQVM7Ozs7O1lBQ2xELFlBQU8sUUFBUSxRQUFTO1lBQ3hCLE1BQU0sSUFBSTtZQUNWLE9BQU8sR0FBRyxJQUFJLE9BQU8sU0FBUyxLQUFNOzs7SUFFNUMsS0FBSzs7OztRQUVELFlBQU8sUUFBUSxLQUFNO1FBRXJCLE9BQU8sTUFBTSxJQUFJLE9BQVE7ZUFDekIsT0FBTyxNQUFNLElBQUksT0FBUTs7V0FFN0IsS0FBSzs7Ozs2QkFFYzs7OztZQUNYLFlBQU8sUUFBUSxRQUFTO1lBQ3hCLE9BQU8sTUFBTSxJQUFJLE9BQVEsWUFBYTs7OztBQUVsRCxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7OztRQUVELGFBQVE7UUFDUixlQUFVLFFBQVE7UUFFbEIsT0FBTyxNQUFNLEtBQUssT0FBUSxPQUFPO2VBQ2pDLE9BQU8sYUFBYSxLQUFLLE9BQVE7O0lBRXJDLEtBQUs7O3FCQUVLLE9BQU8sUUFBUSxRQUFRLEtBQU0sWUFBWTs7V0FFbkQsS0FBSzs7cUJBRUssT0FBTyxRQUFRLFFBQVEsZUFBZ0IsWUFBWTs7O0FBRWpFLEtBQUssU0FBUzs7SUFFVixLQUFLOztxQkFFSyxPQUFPLFFBQVEsUUFBUSxRQUFTLFlBQVk7O1dBRXRELEtBQUs7O3FCQUVLLE9BQU8sUUFBUSxRQUFRLE1BQU8sV0FBWSxZQUFZOzs7QUFFcEUsS0FBSyxTQUFTOztJQUVWLEtBQUs7O3FCQUVLLE9BQU8sUUFBUSxRQUFRLFdBQVksWUFBWTs7V0FFekQsS0FBSzs7cUJBRUssT0FBTyxRQUFRLFFBQVEsU0FBVSxXQUFZLFlBQVkifQ==
//# sourceURL=file://kode/test_old/cli.test.kode
