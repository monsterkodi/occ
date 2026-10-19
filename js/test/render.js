var toExport = {}
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var at60, at80, background, bare, blanked, cases, colored, custom, dateOf, day, expected, fixed, i, just, key, MINUTE, ms, narrow, normal, out, over, plain, row, session, shown, strip, width, withColor

import render from "../render.js"
import style from "../style.js"

import utils from "./utils.js"
let matches = utils.matches

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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlcyI6WyIuLi8uLi9rb2RlL3Rlc3QvcmVuZGVyLmtvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBV0EsUUFBUSxNQUFNLFlBQVk7QUFDMUIsVUFBVSxNQUFNLFlBQVk7QUFFNUIsU0FBUztBQUVULFdBQ0ksR0FBSSxtQkFDSixNQUFPLGdCQUNQLGFBQWMsY0FDZCxhQUFjLGdCQUFnQixPQUM5QixVQUFXLGdCQUFnQixPQUMzQixNQUFPOztBQUVYOztXQUFrQixLQUFLLFFBQVEsa0JBQW1COzs7QUFFbEQ7Ozs7SUFFSSxTQUFTLE9BQU8sVUFBVyxRQUFTO1dBQ3BDLE9BQU8sY0FBYyxPQUFRLE1BQU8sTUFBTzs7O0FBSS9DOzs7O0lBRUksS0FBSyxpQ0FBaUMsS0FBSyxNQUFNO1FBSzlDLE1BQUs7O2VBQVk7O1dBQ3BCLEVBQUU7OztBQUVOOztnQkFDUyxLQUFLLEtBQU0sUUFBUSxFQUFHLEtBQU0sTUFBTyxRQUFTLEVBQUcsSUFBRzs7O0FBRTNEOzt3QkFBb0M7Ozs7OztRQVk1QixVQUNLLEVBQUcsTUFDSCxJQUFLLE1BQ0wsTUFBTyxNQUNQLE1BQU8sTUFDUCxRQUFRLE1BQU8sTUFDZixNQUFPLE1BQ1AsS0FBSyxNQUFPLE9BQ1osS0FBSyxNQUFPLE9BQ1osUUFBUyxPQUNULEtBQUssUUFBUyxTQUNkLE1BQU0sU0FBVTs0QkFHQzs7Ozs7WUFDbEIsTUFBTSxPQUFPLGdCQUFnQjtvQkFDN0IsSUFBTTtZQUNOLFFBQVEsSUFBSzs7Ozs7aUJBSWhCLE9BQU8sZ0JBQWdCLFFBQVU7Ozs7UUFJbEMsT0FBTyxPQUFPLGdCQUFnQixTQUFTO1FBQ3ZDLE9BQU8sT0FBTyxnQkFBZ0IsVUFBVTtnQkFFeEMsS0FBSyxPQUFTO2dCQUNkLEtBQUssT0FBUzs7Ozs7Ozs7UUFZZCxRQUFRLE1BQU0sT0FBUTs7OztRQUl0QixRQUFRLE1BQU0sT0FBUTs7OztRQUl0QixNQUFNLE1BQU0sS0FBSyxVQUFXLGdCQUFnQixLQUFLO2lCQUNoRCxJQUFJ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
//# sourceURL=file://kode/test/render.kode
