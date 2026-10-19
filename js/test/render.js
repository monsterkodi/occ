var toExport = {}
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var at60, at80, background, bare, blanked, cases, colored, custom, dateOf, day, expected, fixed, i, just, key, MINUTE, ms, narrow, normal, out, over, plain, row, session, shown, strip, width, withColor

import render from "../render.js"

import style from "../style.js"

import helpers from "./helpers.js"
let matches = helpers.matches

plain = style.createStyle(false)
colored = style.createStyle(true)
MINUTE = 60000
session = {id:'ses_aaaaaaaaaaaa',title:'First session',time_created:1791283494422,time_updated:1791283494422 + MINUTE,time_last:1791283494422 + MINUTE,turns:2}

strip = function (text)
{
    return text.replace(/\x1b\[[0-9;]*m/g,'')
}

row = function (over = {}, width = 80, color = plain, options = undefined)
{
    var merged

    merged = Object.assign({},session,over)
    return render.renderSession(merged,width,color,options)
}

dateOf = function (text)
{
    var m

    m = (/^\x20(\w{6}\x20+)(\d\d\.\d\d)/).exec(strip(text))
    if (m === null)
    {
        return undefined
    }
    return m[2]
}

day = function (month, date, hours, minutes)
{
    return (new Date(2026,month - 1,date,hours,minutes,0,0)).getTime()
}

background = function (text)
{
    return `\u001b[44m${text}\u001b[49m`
}
toExport["durationMinutes"] = function ()
{
    section("is whole minutes, with no unit", function ()
    {
        cases = [[0,'0'],[999,'0'],[59999,'0'],[60000,'1'],[60000 + 59999,'1'],[90000,'1'],[18 * 60000,'18'],[59 * 60000,'59'],[3600000,'60'],[24 * 3600000,'1440'],[365 * 86400000,'525600']]
        var list = _k_.list(cases)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            ms = list[_a_][0]
            expected = list[_a_][1]
            out = render.durationMinutes(ms)
            compare(out,expected)
            matches(out,/^\d+$/)
        }
    })
    section("a negative span reads as zero", function ()
    {
        compare((render.durationMinutes(-5000)),'0')
    })
    section("six digits covers just under two years", function ()
    {
        just = render.durationMinutes(999999 * MINUTE)
        over = render.durationMinutes(1000000 * MINUTE)
        compare(just.length,6)
        compare(over.length,7)
    })
}
toExport["durationMinutes"]._section_ = true
toExport["renderSession"] = function ()
{
    section("id has the ses_ prefix stripped and is cropped to 6", function ()
    {
        matches(strip(row()),/^\x20aaaaaa\x20/)
    })
    section("last is day.month hour:minute, 11 chars", function ()
    {
        matches(strip(row()),/^\x20aaaaaa\x20+\d\d\.\d\d\x20\d\d:\d\d\x20/)
    })
    section("last reads the time of the last turn, not the start", function ()
    {
        out = strip(row({time_last:1791283494422 + 24 * 3600000}))
        compare((out.startsWith(" aaaaaa  07.10 12:44 ")),true)
    })
    section("a session without a last turn falls back to its update time", function ()
    {
        out = strip(row({time_last:undefined}))
        compare((out.startsWith(" aaaaaa  06.10 12:45 ")),true)
    })
    section("null title prints NULL", function ()
    {
        out = strip(row({title:null}))
        matches(out,/\x20NULL/)
    })
    section("every cell is inset by one space on each side", function ()
    {
        out = strip(row({title:'zz'}))
        compare((out.startsWith(" aaaaaa  06.10 12:45 ")),true)
        compare((out.includes("zz  ")),true)
        compare(out.length,80)
    })
    section("the fixed columns are 34 wide and do not move with the terminal", function ()
    {
        fixed = function (text)
        {
            var line

            line = strip(row({title:'z'},text))
            return line.slice(0,35)
        }
        compare((fixed(40)),(fixed(120)))
        compare(fixed(80).length,35)
    })
    section("the duration column holds six digits of minutes", function ()
    {
        out = strip(row({time_last:1791283494422 + 999999 * MINUTE}))
        matches(out,/\s999999\s/)
    })
    section("duration measures to the last message, not the update time", function ()
    {
        out = strip(row({time_last:1791283494422 + 5 * MINUTE}))
        matches(out,/\s5\s/)
    })
    section("a session without a last turn measures to its update time", function ()
    {
        out = strip(row({time_last:undefined}))
        matches(out,/\s1\s/)
    })
    section("the name column fills to the terminal edge", function ()
    {
        at80 = strip(row({title:'zz'},80))
        at60 = strip(row({title:'zz'},60))
        compare(at80.length,80)
        compare(at60.length,60)
    })
    section("a long name is cropped inside the name column", function ()
    {
        out = strip(row({title:('x').repeat,200:200},50))
        compare((out.includes('…')),true)
        compare(out.length,50)
    })
    section("the row fills the terminal, or falls back to its minimum width", function ()
    {
        var list1 = [38,40,60,120]
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            width = list1[_b_]
            out = strip(row({title:('y').repeat,200:200},width))
            compare(out.length <= width,true)
        }
        narrow = strip(row({},20))
        normal = strip(row({},80))
        compare(narrow.length,37)
        compare(normal.length,80)
    })
}
toExport["renderSession"]._section_ = true
toExport["renderSession repeatDate"] = function ()
{
    section("a repeated date renders as spaces, the time stays in its column", function ()
    {
        out = row({time_last:day(10,7,11,0)},80,plain,{repeatDate:true})
        matches(strip(out),/^\x20aaaaaa\x20+\x20{6}\d\d:\d\d\x20/)
    })
    section("the hour sits in the same column with and without a date", function ()
    {
        blanked = strip(row({time_last:day(10,7,11,0)},80,plain,{repeatDate:true}))
        shown = strip(row({time_last:day(10,7,11,0)},80,plain,{repeatDate:false}))
        compare((blanked.indexOf('11:00')),(shown.indexOf('11:00')))
    })
    section("the date is printed when repeatDate is not set", function ()
    {
        out = row({time_last:day(10,7,11,0)},80,plain,{repeatDate:false})
        compare((dateOf(out)),'07.10')
    })
    section("the row keeps its width and its cell positions with a repeated date", function ()
    {
        blanked = row({time_last:day(10,7,11,0)},80,plain,{repeatDate:true})
        shown = row({time_last:day(10,7,11,0)},80,plain,{repeatDate:false})
        compare(blanked.length,shown.length)
        compare(strip(blanked).length,80)
        compare((strip(blanked).slice(21)),(strip(shown).slice(21)))
        compare((strip(blanked)),(strip(shown).replace('07.10','     ')))
    })
    section("colors wrap the blanked date like any other cell", function ()
    {
        custom = style.createStyle(true)
        background = function (text)
        {
            return `\u001b[44m${text}\u001b[49m`
        }
        custom.row.last = background
        out = row({time_last:day(10,7,11,0)},80,custom,{repeatDate:true})
        compare((out.includes("\u001b[44m")),true)
        compare(strip(out).length,80)
    })
}
toExport["renderSession repeatDate"]._section_ = true
toExport["renderSession padding"] = function ()
{
    section("cell padding sits inside the role, so a background reaches the gap", function ()
    {
        custom = style.createStyle(true)
        custom.row.id = background
        custom.row.last = background
        out = row({},80,custom)
        compare((out.startsWith("\u001b[44m aaaaaa ")),true)
    })
    section("no space between two cells is left unstyled", function ()
    {
        custom = style.createStyle(true)
        var list2 = ['id','last','duration','turns','name']
        for (var _c_ = 0; _c_ < list2.length; _c_++)
        {
            key = list2[_c_]
            custom.row[key] = background
        }
        out = row({},80,custom)
        bare = strip(out)
        i = 1
        while (i < bare.length)
        {
            if (bare[i] !== ' ')
            {
                i += 1
            }
            compare((out.includes("\u001b[44m")),true)
            i += 1
        }
    })
    section("a fully backgrounded row has the same visible text as a plain one", function ()
    {
        custom = style.createStyle(true)
        var list3 = ['id','last','duration','turns','name']
        for (var _d_ = 0; _d_ < list3.length; _d_++)
        {
            key = list3[_d_]
            custom.row[key] = background
        }
        compare((strip(row({},80,custom))),(strip(row({},80))))
    })
}
toExport["renderSession padding"]._section_ = true
toExport["renderSession colors"] = function ()
{
    section("colors do not shift or truncate the visible text", function ()
    {
        compare((strip(row({},80,colored))),(strip(row())))
        var list4 = [40,80,120]
        for (var _e_ = 0; _e_ < list4.length; _e_++)
        {
            width = list4[_e_]
            withColor = row({},width,colored)
            compare(strip(withColor).length,strip(row({},width)).length)
            compare(strip(withColor).length <= width,true)
        }
    })
    section("a colored long name still ends at the terminal edge", function ()
    {
        out = strip(row({title:('q').repeat,200:200},50,colored))
        compare(out.length,50)
        compare((out.includes('…')),true)
    })
}
toExport["renderSession colors"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlcyI6WyIuLi8uLi9rb2RlL3Rlc3QvcmVuZGVyLmtvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVlBLFFBQVEsTUFBTSxZQUFZO0FBQzFCLFVBQVUsTUFBTSxZQUFZO0FBRTVCLFNBQVM7QUFFVCxXQUNJLEdBQUksbUJBQ0osTUFBTyxnQkFDUCxhQUFjLGNBQ2QsYUFBYyxnQkFBZ0IsT0FDOUIsVUFBVyxnQkFBZ0IsT0FDM0IsTUFBTzs7QUFFWDs7V0FBa0IsS0FBSyxRQUFRLGtCQUFtQjs7O0FBRWxEOzs7O0lBRUksU0FBUyxPQUFPLFVBQVcsUUFBUztXQUNwQyxPQUFPLGNBQWMsT0FBUSxNQUFPLE1BQU87OztBQUkvQzs7OztJQUVJLEtBQUssaUNBQWlDLEtBQUssTUFBTTtRQUs5QyxNQUFLOztlQUFZOztXQUNwQixFQUFFOzs7QUFFTjs7Z0JBQ1MsS0FBSyxLQUFNLFFBQVEsRUFBRyxLQUFNLE1BQU8sUUFBUyxFQUFHLElBQUc7OztBQUUzRDs7d0JBQW9DOzs7Ozs7UUFZNUIsVUFDSyxFQUFHLE1BQ0gsSUFBSyxNQUNMLE1BQU8sTUFDUCxNQUFPLE1BQ1AsUUFBUSxNQUFPLE1BQ2YsTUFBTyxNQUNQLEtBQUssTUFBTyxPQUNaLEtBQUssTUFBTyxPQUNaLFFBQVMsT0FDVCxLQUFLLFFBQVMsU0FDZCxNQUFNLFNBQVU7NEJBR0M7Ozs7O1lBQ2xCLE1BQU0sT0FBTyxnQkFBZ0I7b0JBQzdCLElBQU07WUFDTixRQUFRLElBQUs7Ozs7O2lCQUloQixPQUFPLGdCQUFnQixRQUFVOzs7O1FBSWxDLE9BQU8sT0FBTyxnQkFBZ0IsU0FBUztRQUN2QyxPQUFPLE9BQU8sZ0JBQWdCLFVBQVU7Z0JBRXhDLEtBQUssT0FBUztnQkFDZCxLQUFLLE9BQVM7Ozs7Ozs7O1FBWWQsUUFBUSxNQUFNLE9BQVE7Ozs7UUFJdEIsUUFBUSxNQUFNLE9BQVE7Ozs7UUFJdEIsTUFBTSxNQUFNLEtBQUssVUFBVyxnQkFBZ0IsS0FBSztpQkFDaEQsSUFB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
//# sourceURL=file://kode/test/render.kode
