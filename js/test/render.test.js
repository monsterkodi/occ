var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var background, colored, dateOf, day, MINUTE, plain, row, session, strip

import test from 'node:test'
import assert from 'node:assert/strict'
import render from "../render.js"

import style from "../style.js"

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
test.describe('durationMinutes',function ()
{
    test('is whole minutes, with no unit',function ()
    {
        var cases, expected, ms, out

        cases = [[0,'0'],[999,'0'],[59999,'0'],[60000,'1'],[60000 + 59999,'1'],[90000,'1'],[18 * 60000,'18'],[59 * 60000,'59'],[3600000,'60'],[24 * 3600000,'1440'],[365 * 86400000,'525600']]
        var list = _k_.list(cases)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            ms = list[_a_][0]
            expected = list[_a_][1]
            out = render.durationMinutes(ms)
            assert.equal(out,expected,`${ms}ms`)
            assert.match(out,/^\d+$/)
        }
    })
    test('a negative span reads as zero',function ()
    {
        return assert.equal(render.durationMinutes(-5000),'0')
    })
    return test('six digits covers just under two years',function ()
    {
        var just, over

        just = render.durationMinutes(999999 * MINUTE)
        over = render.durationMinutes(1000000 * MINUTE)
        assert.equal(just.length,6)
        return assert.equal(over.length,7)
    })
})
test.describe('renderSession',function ()
{
    test('id has the ses_ prefix stripped and is cropped to 6',function ()
    {
        return assert.match(strip(row()),/^\x20aaaaaa\x20/)
    })
    test('last is day.month hour:minute, 11 chars',function ()
    {
        return assert.match(strip(row()),/^\x20aaaaaa\x20+\d\d\.\d\d\x20\d\d:\d\d\x20/)
    })
    test('last reads the time of the last turn, not the start',function ()
    {
        var out

        out = strip(row({time_last:1791283494422 + 24 * 3600000}))
        return assert.ok(out.startsWith(" aaaaaa  07.10 12:44 "),JSON.stringify,out.slice(0,24))
    })
    test('a session without a last turn falls back to its update time',function ()
    {
        var out

        out = strip(row({time_last:undefined}))
        return assert.ok(out.startsWith(" aaaaaa  06.10 12:45 "),JSON.stringify,out.slice(0,24))
    })
    test('null title prints NULL',function ()
    {
        var out

        out = strip(row({title:null}))
        return assert.match(out,/\x20NULL/)
    })
    test('every cell is inset by one space on each side',function ()
    {
        var out

        out = strip(row({title:'zz'}))
        assert.ok(out.startsWith(" aaaaaa  06.10 12:45 "),JSON.stringify,out.slice(0,24))
        assert.ok(out.includes("zz  "),JSON.stringify,out.slice(0,40))
        return assert.equal(out.length,80)
    })
    test('the fixed columns are 34 wide and do not move with the terminal',function ()
    {
        var fixed

        fixed = function (text)
        {
            var line

            line = strip(row({title:'z'},text))
            return line.slice(0,35)
        }
        assert.equal(fixed(40),fixed(120))
        return assert.equal(fixed(80).length,35)
    })
    test('the duration column holds six digits of minutes',function ()
    {
        var out

        out = strip(row({time_last:1791283494422 + 999999 * MINUTE}))
        return assert.match(out,/\s999999\s/)
    })
    test('duration measures to the last message, not the update time',function ()
    {
        var out

        out = strip(row({time_last:1791283494422 + 5 * MINUTE}))
        return assert.match(out,/\s5\s/,JSON.stringify,out.slice(0,32))
    })
    test('a session without a last turn measures to its update time',function ()
    {
        var out

        out = strip(row({time_last:undefined}))
        return assert.match(out,/\s1\s/,JSON.stringify,out.slice(0,32))
    })
    test('the name column fills to the terminal edge',function ()
    {
        var at60, at80

        at80 = strip(row({title:'zz'},80))
        at60 = strip(row({title:'zz'},60))
        assert.equal(at80.length,80)
        return assert.equal(at60.length,60)
    })
    test('a long name is cropped inside the name column',function ()
    {
        var out

        out = strip(row({title:('x').repeat,200:200},50))
        assert.ok(out.includes('…'),out)
        return assert.equal(out.length,50)
    })
    return test('the row fills the terminal, or falls back to its minimum width',function ()
    {
        var narrow, normal, out, width

        var list = [38,40,60,120]
        for (var _b_ = 0; _b_ < list.length; _b_++)
        {
            width = list[_b_]
            out = strip(row({title:('y').repeat,200:200},width))
            assert.ok(out.length <= width,`width ${width} produced ${out.length}`)
        }
        narrow = strip(row({},20))
        normal = strip(row({},80))
        assert.equal(narrow.length,37)
        return assert.equal(normal.length,80)
    })
})

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
test.describe('renderSession repeatDate',function ()
{
    test('a repeated date renders as spaces, the time stays in its column',function ()
    {
        var out

        out = row({time_last:day(10,7,11,0)},80,plain,{repeatDate:true})
        return assert.match(strip(out),/^\x20aaaaaa\x20+\x20{6}\d\d:\d\d\x20/,JSON.stringify(strip(out).slice,0,24))
    })
    test('the hour sits in the same column with and without a date',function ()
    {
        var blanked, shown

        blanked = strip(row({time_last:day(10,7,11,0)},80,plain,{repeatDate:true}))
        shown = strip(row({time_last:day(10,7,11,0)},80,plain,{repeatDate:false}))
        return assert.equal(blanked.indexOf('11:00'),shown.indexOf('11:00'))
    })
    test('the date is printed when repeatDate is not set',function ()
    {
        var out

        out = row({time_last:day(10,7,11,0)},80,plain,{repeatDate:false})
        return assert.equal(dateOf(out),'07.10')
    })
    test('the row keeps its width and its cell positions with a repeated date',function ()
    {
        var blanked, shown

        blanked = row({time_last:day(10,7,11,0)},80,plain,{repeatDate:true})
        shown = row({time_last:day(10,7,11,0)},80,plain,{repeatDate:false})
        assert.equal(blanked.length,shown.length)
        assert.equal(strip(blanked).length,80)
        assert.equal(strip(blanked).slice(21),strip(shown).slice(21))
        return assert.equal(strip(blanked),strip(shown).replace('07.10','     '))
    })
    return test('colors wrap the blanked date like any other cell',function ()
    {
        var background, custom, out

        custom = style.createStyle(true)
        background = function (text)
        {
            return `\u001b[44m${text}\u001b[49m`
        }
        custom.row.last = background
        out = row({time_last:day(10,7,11,0)},80,custom,{repeatDate:true})
        assert.ok(out.includes("\u001b[44m"),'the cell lost its background')
        return assert.equal(strip(out).length,80)
    })
})

background = function (text)
{
    return `\u001b[44m${text}\u001b[49m`
}
test.describe('renderSession padding',function ()
{
    test('cell padding sits inside the role, so a background reaches the gap',function ()
    {
        var custom, out

        custom = style.createStyle(true)
        custom.row.id = background
        custom.row.last = background
        out = row({},80,custom)
        return assert.ok(out.startsWith("\u001b[44m aaaaaa "),JSON.stringify,out.slice(0,20))
    })
    test('no space between two cells is left unstyled',function ()
    {
        var bare, custom, i, key, out

        custom = style.createStyle(true)
        var list = ['id','last','duration','turns','name']
        for (var _c_ = 0; _c_ < list.length; _c_++)
        {
            key = list[_c_]
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
            assert.ok(out.includes("\u001b[44m"),`space at ${i} sits outside a background`)
            i += 1
        }
    })
    return test('a fully backgrounded row has the same visible text as a plain one',function ()
    {
        var custom, key

        custom = style.createStyle(true)
        var list = ['id','last','duration','turns','name']
        for (var _d_ = 0; _d_ < list.length; _d_++)
        {
            key = list[_d_]
            custom.row[key] = background
        }
        return assert.equal(strip(row({},80,custom)),strip(row({},80)))
    })
})
test.describe('renderSession colors',function ()
{
    test('colors do not shift or truncate the visible text',function ()
    {
        var width, withColor

        assert.equal(strip(row({},80,colored)),strip(row()))
        var list = [40,80,120]
        for (var _e_ = 0; _e_ < list.length; _e_++)
        {
            width = list[_e_]
            withColor = row({},width,colored)
            assert.equal(strip(withColor).length,(strip,row({},width)).length)
            assert.ok(strip(withColor).length <= width)
        }
    })
    return test('a colored long name still ends at the terminal edge',function ()
    {
        var out

        out = strip(row({title:('q').repeat,200:200},50,colored))
        assert.equal(out.length,50)
        return assert.ok(out.includes,'…')
    })
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9yZW5kZXIudGVzdC5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7O09BUU8sS0FBSyxLQUFLO09BQ1YsT0FBTyxLQUFLOzs7OztBQUtuQixRQUFRLE1BQU0sWUFBWTtBQUMxQixVQUFVLE1BQU0sWUFBWTtBQUU1QixTQUFTO0FBRVQsV0FDSSxHQUFJLG1CQUNKLE1BQU8sZ0JBQ1AsYUFBYyxjQUNkLGFBQWMsZ0JBQWdCLE9BQzlCLFVBQVcsZ0JBQWdCLE9BQzNCLE1BQU87O0FBRVg7O1dBQWtCLEtBQUssUUFBUSxrQkFBbUI7OztBQUVsRDs7OztJQUVJLFNBQVMsT0FBTyxVQUFXLFFBQVM7V0FDcEMsT0FBTyxjQUFjLE9BQVEsTUFBTyxNQUFPOztBQVEvQyxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7OztRQUVELFVBQ0ssRUFBRyxNQUNILElBQUssTUFDTCxNQUFPLE1BQ1AsTUFBTyxNQUNQLFFBQVEsTUFBTyxNQUNmLE1BQU8sTUFDUCxLQUFLLE1BQU8sT0FDWixLQUFLLE1BQU8sT0FDWixRQUFTLE9BQ1QsS0FBSyxRQUFTLFNBQ2QsTUFBTSxTQUFVOzRCQUdDOzs7OztZQUNsQixNQUFNLE9BQU8sZ0JBQWdCO1lBQzdCLE9BQU8sTUFBTSxJQUFLLFlBQWE7WUFDL0IsT0FBTyxNQUFNLElBQUs7OztJQUUxQixLQUFLOztlQUVELE9BQU8sTUFBTSxPQUFPLGdCQUFnQixPQUFROztXQUVoRCxLQUFLOzs7O1FBRUQsT0FBTyxPQUFPLGdCQUFnQixTQUFTO1FBQ3ZDLE9BQU8sT0FBTyxnQkFBZ0IsVUFBVTtRQUV4QyxPQUFPLE1BQU0sS0FBSyxPQUFRO2VBQzFCLE9BQU8sTUFBTSxLQUFLLE9BQVE7OztBQVFsQyxLQUFLLFNBQVM7O0lBRVYsS0FBSzs7ZUFFRCxPQUFPLE1BQU0sTUFBTSxPQUFROztJQUUvQixLQUFLOztlQUVELE9BQU8sTUFBTSxNQUFNLE9BQVE7O0lBRS9CLEtBQUs7Ozs7UUFFRCxN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
//# sourceURL=file://kode/test/render.test.kode
