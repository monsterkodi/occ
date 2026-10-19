var toExport = {}
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var bare, command, found, here, home, listed, LISTED, occ, occRun, out, READ_COMMANDS, refuses, res, root, skip, stdoutOf

import child from 'node:child_process'
import path from 'node:path'
import url from 'node:url'
import build from "./fixtures/build.js"

import utils from "./utils.js"
let matches = utils.matches
let notMatches = utils.notMatches

here = url.fileURLToPath(import.meta.url)
root = path.join(path.dirname(here),'..','..')
occ = path.join(root,'bin/occ')
home = build.makeDataHome().home
READ_COMMANDS = ['ls','cat','log','shell']
LISTED = /^\x20+occ\x20(\w+)/gm

occRun = function (args, env = {})
{
    var all, base, envs, res

    all = [occ].concat(args)
    base = {XDG_DATA_HOME:home,NO_COLOR:'1'}
    envs = Object.assign({},process.env,base,env)
    res = child.spawnSync(process.execPath,all,{env:envs,encoding:'utf8'})
    return {stdout:res.stdout,stderr:res.stderr,status:res.status}
}

stdoutOf = function (res)
{
    compare(res.status,0)
    return res.stdout
}

refuses = function (res, pattern)
{
    if (res.status !== 1)
    {
        return compare(res.status,1)
    }
    return matches(res.stderr,pattern)
}
toExport["cli read commands"] = function ()
{
    section("every read command runs and prints something", function ()
    {
        var list = _k_.list(READ_COMMANDS)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            command = list[_a_]
            out = stdoutOf(occRun([command,'aaaaaa']))
            matches(out,/aaaaaa/)
        }
    })
    section("every read command with no ids runs", function ()
    {
        var list1 = _k_.list(READ_COMMANDS)
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            command = list1[_b_]
            out = stdoutOf(occRun([command]))
            compare(out.trim().length > 0,true)
        }
    })
    section("every command in the help table is dispatchable", function ()
    {
        res = occRun(['--help'])
        found = res.stdout.matchAll(LISTED)
        listed = Array.from(found).map(function (m)
        {
            return m[1]
        })
        compare(listed.includes('ls'),true)
        skip = ['del','resume']
        var list2 = _k_.list(listed.filter(function (c)
        {
            return !skip.includes(c)
        }))
        for (var _c_ = 0; _c_ < list2.length; _c_++)
        {
            command = list2[_c_]
            out = stdoutOf(occRun([command,'aaaaaa']))
            compare(out.trim().length > 0,true)
        }
    })
    section("a title argument works end to end", function ()
    {
        out = stdoutOf(occRun(['ls','ocls']))
        matches(out,/aaaaaa/)
        matches(out,/Coco\x20-\x20ocls/)
    })
    section("every read command accepts a title argument", function ()
    {
        var list3 = _k_.list(READ_COMMANDS)
        for (var _d_ = 0; _d_ < list3.length; _d_++)
        {
            command = list3[_d_]
            out = stdoutOf(occRun([command,'ocls']))
            matches(out,/aaaaaa/)
        }
    })
}
toExport["cli read commands"]._section_ = true
toExport["cli help"] = function ()
{
    section("no arguments falls back to ls", function ()
    {
        bare = stdoutOf(occRun([]))
        listed = stdoutOf(occRun(['ls']))
        compare(bare,listed)
        notMatches(bare,/usage:/)
    })
    section("an empty argument is still a command lookup", function ()
    {
        refuses(occRun(['']),/unknown\x20command/)
    })
    section("an unknown command fails with a message", function ()
    {
        refuses(occRun(['frobnicate']),/unknown\x20command\x20\"frobnicate\"/)
    })
}
toExport["cli help"]._section_ = true
toExport["cli del"] = function ()
{
    section("is dispatched and reaches its own guard", function ()
    {
        refuses(occRun(['del']),/at\x20least\x20one\x20session\x20id/)
    })
    section("refuses without a terminal", function ()
    {
        refuses(occRun(['del','aaaaaa']),/needs\x20a\x20terminal/)
    })
}
toExport["cli del"]._section_ = true
toExport["cli resume"] = function ()
{
    section("is dispatched and reaches its own guard", function ()
    {
        refuses(occRun(['resume']),/exactly\x20one\x20session\x20id/)
    })
    section("refuses without a terminal", function ()
    {
        refuses(occRun(['resume','aaaaaa']),/needs\x20a\x20terminal/)
    })
}
toExport["cli resume"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlcyI6WyIuLi8uLi9rb2RlL3Rlc3QvY2xpLmtvZGUiXSwibWFwcGluZ3MiOiI7Ozs7O09BUU8sTUFBTSxLQUFLO09BQ1gsS0FBSyxLQUFLO09BQ1YsSUFBSSxLQUFLOzs7Ozs7O0FBUWhCLE9BQU8sSUFBSSxjQUFjLE9BQU8sS0FBSztBQUVyQyxPQUFPLEtBQUssS0FBSyxLQUFLLFFBQVEsTUFBTyxLQUFNO0FBRTNDLE1BQU0sS0FBSyxLQUFLLEtBQU07QUFFdEIsT0FBTyxNQUFNLGVBQWU7QUFFNUIsaUJBQWlCLEtBQUssTUFBTSxNQUFNO0FBT2xDLFNBQVM7O0FBTVQ7Ozs7SUFLSSxPQUFPLEtBQUssT0FBTztJQUNuQixRQUFRLGNBQWUsS0FBTSxTQUFVO0lBQ3ZDLE9BQU8sT0FBTyxVQUFXLFFBQVEsSUFBSyxLQUFNO0lBRTVDLE1BQU0sTUFBTSxVQUFVLFFBQVEsU0FBVSxLQUFNLElBQUssS0FBTSxTQUFVO1lBRW5FLE9BQVEsSUFBSSxPQUNaLE9BQVEsSUFBSSxPQUNaLE9BQVEsSUFBSTs7O0FBTWhCOztZQUVJLElBQUksT0FBUztXQUNiLElBQUk7OztBQU1SOztRQUVPLElBQUksV0FBVTs7dUJBQ1gsSUFBSSxPQUFTOztXQUNuQixRQUFRLElBQUksT0FBUTs7Ozs7OzRCQU1EOzs7O1lBQ1gsTUFBTSxTQUFTLFFBQVEsUUFBUztZQUNoQyxRQUFRLElBQUs7Ozs7OzZCQUlGOzs7O1lBQ1gsTUFBTSxTQUFTLFFBQVE7b0JBQ3ZCLElBQUksT0FBTyxTQUFTLEVBQUk7Ozs7O1FBSTVCLE1BQU0sUUFBUTtRQUVkLFFBQVEsSUFBSSxPQUFPLFNBQVM7UUFDNUIsU0FBUyxNQUFNLEtBQUssT0FBTzs7bUJBQVcsRUFBRTs7Z0JBRXhDLE9BQU8sU0FBUyxNQUFPO1FBRXZCLFFBQVEsTUFBTTs2QkFFQyxPQUFPOztvQkFBa0IsS0FBSyxTQUFTOzs7OztZQUNsRCxNQUFNLFNBQVMsUUFBUSxRQUFTO29CQUNoQyxJQUFJLE9BQU8sU0FBUyxFQUFJOzs7OztRQUk1QixNQUFNLFNBQVMsUUFBUSxLQUFNO1FBRTdCLFFBQVEsSUFBSztRQUNiLFFBQVEsSUFBSzs7Ozs2QkFJRTs7OztZQUNYLE1BQU0sU0FBUyxRQUFRLFFBQVM7WUFDaEMsUUFBUSxJQUFLOzs7Ozs7Ozs7UUFNakIsT0FBTyxTQUFTO1FBQ2hCLFNBQVMsU0FBUyxRQUFRO2dCQUUxQixLQUFPO1FBQ1AsV0FBVyxLQUFNOzs7O1FBSWpCLFFBQVEsUUFBUSxLQUFNOzs7O1FBSXRCLFFBQVEsUUFBUSxlQUFnQjs7Ozs7Ozs7UUFNaEMsUUFBUSxRQUFRLFFBQVM7Ozs7UUFJekIsUUFBUSxRQUFRLE1BQU8sV0FBWTs7Ozs7Ozs7UUFNbkMsUUFBUSxRQUFRLFdBQVk7Ozs7UUFJNUIsUUFBUSxRQUFRLFNBQVUsV0FBWSJ9
//# sourceURL=file://kode/test/cli.kode
