var toExport = {}
var DB_PATH, every, lines, out, plain, run, secondRow

import build from "./fixtures/build.js"

import db from "../db.js"
import shell from "../shell.js"
import style from "../style.js"

import utils from "./utils.js"
let throws = utils.throws

DB_PATH = build.fixtures().DB_PATH
plain = style.createStyle(false)

run = function (ids, width = 80)
{
    var database

    database = db.openDb(DB_PATH)
    return shell({db:database,prefixes:ids,width:width,style:plain})
}
toExport["shell blocks"] = async function ()
{
    await section("starts with the session row, then the commands", async function ()
    {
        lines = run(['cccccc']).split('\n')
        compare(lines[0].trimStart().startsWith('cccccc '),true)
        compare(lines.includes('$ shell'),true)
    })
    await section("shows the result of every command, successful or not", async function ()
    {
        out = run(['cccccc'])
        compare(out.includes("$ shell result\nhi"),true)
        compare(out.includes("$ shell result\nboom"),true)
    })
    await section("shows an exit marker for a nonzero exit", async function ()
    {
        compare(run(['cccccc']).includes('$ shell exit 42'),true)
    })
    await section("a successful command gets no exit marker", async function ()
    {
        compare(!run(['cccccc']).includes('$ shell exit 0'),true)
    })
    await section("shows the agent marker, since it labels whose commands these are", async function ()
    {
        compare(run(['cccccc']).includes('> agent build'),true)
    })
}
toExport["shell blocks"]._section_ = true
toExport["shell filtering"] = async function ()
{
    await section("shows no user turns and no continuation ellipses", async function ()
    {
        out = run(['cccccc'])
        compare(!out.includes('> user'),true)
        compare(!out.includes("\n…"),true)
        compare(!out.includes('one'),true)
    })
    await section("only shell tools are shown", async function ()
    {
        out = run(['aaaaaa'])
        compare(out.includes('$ shell'),true)
        compare(!out.includes('$ read'),true)
        compare(!out.includes('$ webfetch'),true)
        compare(!out.includes('$ grep'),true)
    })
    await section("a non-shell tool is never shown even when its name is close", async function ()
    {
        compare(!run(['cccccc']).includes('$ bash'),true)
    })
    await section("no ellipsis markers anywhere, since there are no runs to continue", async function ()
    {
        every = run([])
        compare(!every.includes("\n…"),true)
    })
}
toExport["shell filtering"]._section_ = true
toExport["shell selection"] = async function ()
{
    await section("shows every session when no ids are given", async function ()
    {
        compare(run([]).includes('$ shell'),true)
    })
    await section("ids filter which sessions are shown", async function ()
    {
        compare(!run(['cccccc']).includes('hyprctl'),true)
        compare(run(['aaaaaa']).includes('hyprctl'),true)
    })
    await section("sessions are separated by a blank line", async function ()
    {
        lines = run(['aaaaaa','cccccc']).split('\n')
        secondRow = lines.findIndex(function (l)
        {
            return l.trimStart().startsWith('cccccc ')
        })
        compare(lines[secondRow - 1],'')
    })
    await section("a session with no shell commands prints only its row", async function ()
    {
        compare(run(['bbbbbb']),run(['bbbbbb']).split('\n')[0])
    })
}
toExport["shell selection"]._section_ = true
toExport["shell errors"] = async function ()
{
    await section("unknown id surfaces the error", async function ()
    {
        throws(function ()
        {
            run(['zzzzzz'])
            return /no\x20session/i
        })
    })
    await section("output ends without a trailing blank line", async function ()
    {
        out = run(['cccccc'])
        compare(!out.endsWith('\n'),true)
    })
}
toExport["shell errors"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGwuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9zaGVsbC5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFZQSxVQUFVLE1BQU0sV0FBVztBQUUzQixRQUFRLE1BQU0sWUFBWTs7QUFFMUI7Ozs7SUFFSSxXQUFXLEdBQUcsT0FBTztXQUNyQixPQUFPLEdBQUksU0FBVSxTQUFVLElBQUssTUFBQSxNQUFPLE1BQU87Ozs7OztRQWE5QyxRQUFRLEtBQUssV0FBVyxNQUFNO2dCQUU5QixNQUFNLEdBQUcsWUFBWSxXQUFXLFdBQWE7Z0JBQzdDLE1BQU0sU0FBUyxXQUFhOzs7O1FBSTVCLE1BQU0sS0FBSztnQkFFWCxJQUFJLFNBQVMsc0JBQXdCO2dCQUNyQyxJQUFJLFNBQVMsd0JBQTBCOzs7O2dCQUl2QyxLQUFLLFdBQVcsU0FBUyxtQkFBcUI7Ozs7aUJBSTFDLEtBQUssV0FBVyxTQUFTLGtCQUFvQjs7OztnQkFJakQsS0FBSyxXQUFXLFNBQVMsaUJBQW1COzs7Ozs7OztRQVk1QyxNQUFNLEtBQUs7aUJBRVAsSUFBSSxTQUFTLFVBQVk7aUJBQ3pCLElBQUksU0FBUyxPQUFTO2lCQUN0QixJQUFJLFNBQVMsT0FBUzs7OztRQUkxQixNQUFNLEtBQUs7Z0JBRVgsSUFBSSxTQUFTLFdBQWE7aUJBQ3RCLElBQUksU0FBUyxVQUFZO2lCQUN6QixJQUFJLFNBQVMsY0FBZ0I7aUJBQzdCLElBQUksU0FBUyxVQUFZOzs7O2lCQUl6QixLQUFLLFdBQVcsU0FBUyxVQUFZOzs7O1FBSXpDLFFBQVE7aUJBQ0osTUFBTSxTQUFTLE9BQVM7Ozs7Ozs7O2dCQVk1QixRQUFRLFNBQVMsV0FBYTs7OztpQkFJMUIsS0FBSyxXQUFXLFNBQVMsV0FBYTtnQkFDMUMsS0FBSyxXQUFXLFNBQVMsV0FBYTs7OztRQUl0QyxRQUFRLEtBQUssU0FBVSxXQUFXLE1BQU07UUFDeEMsWUFBWSxNQUFNOzttQkFBaUIsRUFBRSxZQUFZLFdBQVc7O2dCQUU1RCxNQUFNLFlBQVksR0FBSzs7OztnQkFJdkIsS0FBSyxXQUFhLEtBQUssV0FBVyxNQUFNLE1BQU07Ozs7Ozs7O1FBWTlDOztZQUFVLEtBQUs7bUJBQVk7Ozs7O1FBSTNCLE1BQU0sS0FBSztpQkFDUCxJQUFJLFNBQVMsTUFBUSJ9
//# sourceURL=file:///home/kodi/s/occ/kode/test/shell.kode
