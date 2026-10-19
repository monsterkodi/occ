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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdF9vbGQvcmVuZGVyLnRlc3Qua29kZSJdLCJtYXBwaW5ncyI6Ijs7OztPQVFPLEtBQUssS0FBSztPQUNWLE9BQU8sS0FBSzs7Ozs7QUFLbkIsUUFBUSxNQUFNLFlBQVk7QUFDMUIsVUFBVSxNQUFNLFlBQVk7QUFFNUIsU0FBUztBQUVULFdBQ0ksR0FBSSxtQkFDSixNQUFPLGdCQUNQLGFBQWMsY0FDZCxhQUFjLGdCQUFnQixPQUM5QixVQUFXLGdCQUFnQixPQUMzQixNQUFPOztBQUVYOztXQUFrQixLQUFLLFFBQVEsa0JBQW1COzs7QUFFbEQ7Ozs7SUFFSSxTQUFTLE9BQU8sVUFBVyxRQUFTO1dBQ3BDLE9BQU8sY0FBYyxPQUFRLE1BQU8sTUFBTzs7QUFRL0MsS0FBSyxTQUFTOztJQUVWLEtBQUs7Ozs7UUFFRCxVQUNLLEVBQUcsTUFDSCxJQUFLLE1BQ0wsTUFBTyxNQUNQLE1BQU8sTUFDUCxRQUFRLE1BQU8sTUFDZixNQUFPLE1BQ1AsS0FBSyxNQUFPLE9BQ1osS0FBSyxNQUFPLE9BQ1osUUFBUyxPQUNULEtBQUssUUFBUyxTQUNkLE1BQU0sU0FBVTs0QkFHQzs7Ozs7WUFDbEIsTUFBTSxPQUFPLGdCQUFnQjtZQUM3QixPQUFPLE1BQU0sSUFBSyxZQUFhO1lBQy9CLE9BQU8sTUFBTSxJQUFLOzs7SUFFMUIsS0FBSzs7ZUFFRCxPQUFPLE1BQU0sT0FBTyxnQkFBZ0IsT0FBUTs7V0FFaEQsS0FBSzs7OztRQUVELE9BQU8sT0FBTyxnQkFBZ0IsU0FBUztRQUN2QyxPQUFPLE9BQU8sZ0JBQWdCLFVBQVU7UUFFeEMsT0FBTyxNQUFNLEtBQUssT0FBUTtlQUMxQixPQUFPLE1BQU0sS0FBSyxPQUFROzs7QUFRbEMsS0FBSyxTQUFTOztJQUVWLEtBQUs7O2VBRUQsT0FBTyxNQUFNLE1BQU0sT0FBUTs7SUFFL0IsS0FBSzs7ZUFFRCxPQUFPLE1BQU0sTUFBTSxPQUFROztJQUUvQixLQUFLOzs7O1FB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
//# sourceURL=file://kode/test_old/render.test.kode
