var toExport = {}
var DB_PATH, lines, out, plain, run, secondRow

import build from "../test/fixtures/build.js"

import db from "../db.js"

import cat from "../cat.js"

import style from "../style.js"

import utils from "./utils.js"
let throws = utils.throws

DB_PATH = build.fixtures().DB_PATH
plain = style.createStyle(false)

run = function (ids, width = 80)
{
    var database

    database = db.openDb(DB_PATH)
    return cat({db:database,prefixes:ids,width:width,style:plain})
}
toExport["cat"] = function ()
{
    section("starts with the session row, then the turns", function ()
    {
        lines = run(['aaaaaa']).split('\n')
        compare(lines[0].trimStart().startsWith('aaaaaa '),true)
        compare(lines[1],'> user')
        compare(lines[2],'hello')
    })
    section("shows no tool calls or results at all", function ()
    {
        out = run(['aaaaaa'])
        compare(!out.includes('$ '),true)
        compare(!out.includes('hyprctl'),true)
    })
    section("text on both sides of a tool call joins into one turn", function ()
    {
        out = run(['aaaaaa'])
        compare(out.includes("hi there\n\ndone listing"),true)
        compare(!out.includes('total 48'),true)
    })
    section("consecutive text parts in one message still join with a blank line", function ()
    {
        compare(run(['aaaaaa']).includes("first bit\n\nsecond bit"),true)
    })
}
toExport["cat"]._section_ = true
toExport["cat selection"] = function ()
{
    section("shows every session when no ids are given", function ()
    {
        out = run([])
        compare(out.includes('> user'),true)
        compare(out.split('\n').filter(function (l)
        {
            return l === '> user'
        }).length,3)
    })
    section("ids filter which sessions are shown", function ()
    {
        out = run(['cccccc'])
        compare(!out.includes('hello'),true)
        compare(out.includes('> user'),true)
    })
    section("ids keep the order they were given in", function ()
    {
        out = run(['bbbbbb','aaaaaa'])
        compare(out.indexOf('bbbbbb') < out.indexOf('aaaaaa'),true)
    })
    section("sessions are separated by a blank line, not a rule", function ()
    {
        lines = run(['aaaaaa','cccccc']).split('\n')
        secondRow = lines.findIndex(function (l)
        {
            return l.trimStart().startsWith('cccccc ')
        })
        compare(lines[secondRow - 1],'')
    })
    section("a session with no renderable turns prints only its row", function ()
    {
        compare(run(['bbbbbb']),run(['bbbbbb']).split('\n')[0])
    })
}
toExport["cat selection"]._section_ = true
toExport["cat errors"] = function ()
{
    section("unknown id surfaces the error", function ()
    {
        throws(function ()
        {
            run(['zzzzzz'])
            return /no\x20session/i
        })
    })
    section("output ends without a trailing blank line", function ()
    {
        out = run(['aaaaaa'])
        compare(!out.endsWith('\n'),true)
    })
}
toExport["cat errors"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2F0LmpzIiwic291cmNlcyI6WyIuLi8uLi9rb2RlL3Rlc3QvY2F0LmtvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBY0EsVUFBVSxNQUFNLFdBQVc7QUFFM0IsUUFBUSxNQUFNLFlBQVk7O0FBRTFCOzs7O0lBRUksV0FBVyxHQUFHLE9BQU87V0FDckIsS0FBSyxHQUFJLFNBQVUsU0FBVSxJQUFLLE1BQUEsTUFBTyxNQUFPOzs7Ozs7UUFRNUMsUUFBUSxLQUFLLFdBQVcsTUFBTTtnQkFFOUIsTUFBTSxHQUFHLFlBQVksV0FBVyxXQUFhO2dCQUM3QyxNQUFNLEdBQUs7Z0JBQ1gsTUFBTSxHQUFLOzs7O1FBSVgsTUFBTSxLQUFLO2lCQUVQLElBQUksU0FBUyxNQUFRO2lCQUNyQixJQUFJLFNBQVMsV0FBYTs7OztRQUk5QixNQUFNLEtBQUs7Z0JBRVgsSUFBSSxTQUFTLDRCQUE4QjtpQkFDdkMsSUFBSSxTQUFTLFlBQWM7Ozs7Z0JBSS9CLEtBQUssV0FBVyxTQUFTLDJCQUE2Qjs7Ozs7Ozs7UUFNdEQsTUFBTTtnQkFFTixJQUFJLFNBQVMsVUFBWTtnQkFDekIsSUFBSSxNQUFNLE1BQU07O21CQUFjLE1BQUs7V0FBVSxPQUFTOzs7O1FBSXRELE1BQU0sS0FBSztpQkFFUCxJQUFJLFNBQVMsU0FBVztnQkFDNUIsSUFBSSxTQUFTLFVBQVk7Ozs7UUFJekIsTUFBTSxLQUFLLFNBQVU7Z0JBRXJCLElBQUksUUFBUSxZQUFZLElBQUksUUFBUSxVQUFZOzs7O1FBSWhELFFBQVEsS0FBSyxTQUFVLFdBQVcsTUFBTTtRQUN4QyxZQUFZLE1BQU07O21CQUFpQixFQUFFLFlBQVksV0FBVzs7Z0JBRTVELE1BQU0sWUFBWSxHQUFLOzs7O2dCQUl2QixLQUFLLFdBQWEsS0FBSyxXQUFXLE1BQU0sTUFBTTs7Ozs7Ozs7UUFNOUM7O1lBQVUsS0FBSzttQkFBWTs7Ozs7UUFJM0IsTUFBTSxLQUFLO2lCQUNQLElBQUksU0FBUyxNQUFRIn0=
//# sourceURL=file://kode/test/cat.kode
