var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var bytesOf, CONTROL_BYTES, CONTROL_DB_PATH, history, plain, run

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "./fixtures/build.js"

import db from "../db.js"

import shell from "../shell.js"

import log from "../log.js"

import ls from "../ls.js"

import render from "../render.js"

import escape from "../escape.js"

import style from "../style.js"

CONTROL_DB_PATH = build.fixtures().CONTROL_DB_PATH
plain = style.createStyle(false)
CONTROL_BYTES = /[\0-\x08\x0b-\x1a\x1c-\x1f\x7f]/
history = log

run = function (command)
{
    var database

    database = db.openDb(CONTROL_DB_PATH)
    if (command === history)
    {
        history({db:database,prefixes:['eeeeee'],width:80,style:plain})
    }
    return command({db:database,prefixes:['eeeeee'],width:80,style:plain})
}

bytesOf = function (text)
{
    return Array.from(Buffer.from(text,'utf8'))
}
test.describe('escapeControl',function ()
{
    test('leaves printable text alone',function ()
    {
        return assert.equal(escape('plain text 123 !?'),'plain text 123 !?')
    })
    test('keeps tab and newline, since they are layout, not noise',function ()
    {
        return assert.equal(escape("a\tb\nc"),"a\tb\nc")
    })
    test('escapes nul as a hex byte',function ()
    {
        return assert.equal(escape("a\0b"),'a\\x00b')
    })
    test('escapes every other c0 control as hex',function ()
    {
        var all, c, c0, hex

        all = Array.from({length:0x20},function (_, i)
        {
            return String.fromCharCode(i)
        })
        c0 = all.filter(function (c)
        {
            return !("\t\n\u001b").includes(c)
        }).join('')
        var list = _k_.list(c0)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            c = list[_a_]
            hex = c.charCodeAt(0).toString(16).padStart(2,'0')
            assert.equal(escape(`a${c}b`),`a\\x${hex}b`,`charcode ${c.charCodeAt(0)}`)
        }
    })
    test('escapes delete',function ()
    {
        return assert.equal(escape("a\u007fb"),'a\\x7fb')
    })
    test('keeps the ansi escape byte, since colors are output to keep',function ()
    {
        return assert.equal(escape("\u001b[31mred\u001b[39m"),"\u001b[31mred\u001b[39m")
    })
    test('leaves multibyte text untouched',function ()
    {
        return assert.equal(escape('héllo → 🎉'),'héllo → 🎉')
    })
    test('coerces a non-string',function ()
    {
        assert.equal(escape(42),'42')
        return assert.equal(escape(null),'null')
    })
    return test('output never carries a control byte other than tab and newline',function ()
    {
        var bad, c, out

        var list = _k_.list(Array.from({length:0x80},function (_, i)
        {
            return String.fromCharCode(i)
        }))
        for (var _b_ = 0; _b_ < list.length; _b_++)
        {
            c = list[_b_]
            out = escape(`a${c}b`)
            bad = bytesOf(out).filter(function (b)
            {
                if (b === 0x09 || b === 0x0a || b === 0x1b)
                {
                    return false
                }
                else
                {
                    return b < 0x20 || b === 0x7f
                }
            })
            assert.deepEqual(bad,[],`charcode ${c.charCodeAt(0)} leaked`)
        }
    })
})
test.describe('control bytes in a session',function ()
{
    var command, entry, name

    test('the raw fixture result really does contain the offending bytes',function ()
    {
        assert.ok(bytesOf(build.CONTROL_RESULT).includes,0x00)
        return assert.ok(bytesOf(build.CONTROL_TITLE).includes,0x00)
    })
    var list = [['shell',shell],['log',history]]
    for (var _c_ = 0; _c_ < list.length; _c_++)
    {
        entry = list[_c_]
        var _d_ = entry; name = _d_[0]; command = _d_[1]

        test(`${name} output holds no control byte that breaks grep`,async function ()
        {
            var out

            out = run(command)
            return assert.ok(!(CONTROL_BYTES.test(out)),JSON.stringify(out))
        })
        test(`${name} shows the nul bytes as \\x00`,async function ()
        {
            var out

            out = run(command)
            return assert.ok(out.includes('\\x00'),out)
        })
    }
    test('the escaped result keeps its tabs, newlines and colors',function ()
    {
        var out

        out = run(shell)
        assert.ok(out.includes,"tab\there")
        assert.ok(out.includes,"<anonymous_script>:1\n")
        return assert.ok(out.includes,"\u001b[31mred\u001b[39m")
    })
    test('a session title with control bytes is escaped in the table',function ()
    {
        var database, out

        database = db.openDb(CONTROL_DB_PATH)
        out = ls({db:database,prefixes:[],width:80,style:plain})
        assert.ok(!(CONTROL_BYTES.test(out)),JSON.stringify(out))
        return assert.ok(out.includes(build.CONTROL_TITLE.replace("\0",'\\x00')),JSON.stringify(out))
    })
    test('a command carrying control bytes is escaped too',function ()
    {
        var blocks, out

        blocks = [{kind:'call',name:'shell',agent:null,command:"printf '\0'"},{kind:'result',name:'shell',text:'ok',outputPath:null}]
        out = render.renderBlocks(blocks,plain)
        assert.ok(!(CONTROL_BYTES.test(out)),JSON.stringify(out))
        return assert.ok(out.includes,"printf '\\x00'",JSON.stringify(out))
    })
    test("a truncated result's output path is escaped as well",function ()
    {
        var blocks, out

        blocks = [{kind:'call',name:'read',agent:null,command:'cat f'},{kind:'result',name:'read',text:'head',outputPath:"/tmp/out\0put"}]
        out = render.renderBlocks(blocks,plain)
        assert.ok(!(CONTROL_BYTES.test(out)),JSON.stringify(out))
        return assert.ok(out.includes,'/tmp/out\\x00put',JSON.stringify(out))
    })
    test('the row renderer escapes a title before it is cropped',function ()
    {
        var out, session

        session = {id:build.CONTROL_SESSION,title:("x").repeat(79) + "\0",time_created:1791283494422,time_updated:1791283494422 + 60000,time_last:1791283494422 + 60000,turns:1}
        out = render.renderSession(session,80,plain)
        assert.ok(!(CONTROL_BYTES.test(out)),JSON.stringify(out))
        return assert.equal(out.length,80)
    })
    return test('escaping survives the round trip through the database',function ()
    {
        var out

        out = run(shell)
        return assert.ok(out.includes,'\\x00\\x00\\x00\\x08\\x10\\x00\\x040\\x00\\x00',JSON.stringify(out))
    })
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbC50ZXN0LmpzIiwic291cmNlcyI6WyIuLi8uLi9rb2RlL3Rlc3QvY29udHJvbC50ZXN0LmtvZGUiXSwibWFwcGluZ3MiOiI7Ozs7T0FRTyxLQUFLLEtBQUs7T0FDVixPQUFPLEtBQUs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV25CLGtCQUFrQixNQUFNLFdBQVc7QUFFbkMsUUFBUSxNQUFNLFlBQVk7QUFLMUIsZ0JBQWdCO0FBSWhCLFVBQVU7O0FBRVY7Ozs7SUFFSSxXQUFXLEdBQUcsT0FBTztRQUVsQixZQUFXOztRQUFhLFNBQVMsR0FBSSxTQUFVLFVBQVcsVUFBVyxNQUFPLEdBQUksTUFBTzs7V0FDMUYsU0FBUyxHQUFJLFNBQVUsVUFBVyxVQUFXLE1BQU8sR0FBSSxNQUFPOzs7QUFFbkU7O1dBQW9CLE1BQU0sS0FBSyxPQUFPLEtBQUssS0FBTTs7QUFHakQsS0FBSyxTQUFTOztJQUVWLEtBQUs7O2VBRUQsT0FBTyxNQUFNLE9BQU8scUJBQXNCOztJQUU5QyxLQUFLOztlQUVELE9BQU8sTUFBTSxPQUFPLFdBQVk7O0lBRXBDLEtBQUs7O2VBRUQsT0FBTyxNQUFNLE9BQU8sUUFBUzs7SUFFakMsS0FBSzs7OztRQUVELE1BQU0sTUFBTSxNQUFNLE9BQVE7O21CQUFpQixPQUFPLGFBQWE7O1FBQy9ELEtBQUssSUFBSTs7cUJBQW1CLGNBQWMsU0FBUztXQUFJLEtBQUs7NEJBRW5EOzs7O1lBQ0wsTUFBTSxFQUFFLFdBQVcsR0FBRyxTQUFTLElBQUksU0FBUyxFQUFHO1lBQy9DLE9BQU8sTUFBTSxXQUFXLGFBQWMsbUJBQW9CLEVBQUUsV0FBVzs7O0lBRS9FLEtBQUs7O2VBRUQsT0FBTyxNQUFNLE9BQU8sWUFBYTs7SUFFckMsS0FBSzs7ZUFFRCxPQUFPLE1BQU0sT0FBTywyQkFBNEI7O0lBRXBELEtBQUs7O2VBRUQsT0FBTyxNQUFNLE9BQU8sY0FBZTs7SUFFdkMsS0FBSzs7UUFFRCxPQUFPLE1BQU0sT0FBTyxJQUFLO2VBQ3pCLE9BQU8sTUFBTSxPQUFPLE1BQU87O1dBRS9CLEtBQUs7Ozs7NEJBRVEsTUFBTSxNQUFNLE9BQVE7O21CQUFpQixPQUFPLGFBQWE7Ozs7O1lBQzlELE1BQU0sV0FBVztZQUNqQixNQUFNLFFBQVEsS0FBSzs7b0JBQ1osTUFBSyxRQUFRLE1BQUssUUFBUSxNQUFLOzsyQkFBVTs7OzsyQkFBVyxJQUFJLFFBQVEsTUFBSzs7O1lBQzVFLE9BQU8sVUFBVSxtQkFBcUIsRUFBRSxXQUFXOzs7O0FBUS9ELEtBQUssU0FBUzs7OztJQUVWLEtBQUs7O1FBRUQsT0FBTyxHQUFHLFFBQVEsTUFBTSxnQkFBZ0IsU0FBUztlQUNqRCxPQUFPLEdBQUcsUUFBUSxNQUFNLGVBQWUsU0FBUzs7aUJBRXJDLFFBQVMsUUFBUSxNQUFPOzs7O2tCQUNqQjs7UUFFbEIsUUFBUTs7OztZQUVKLE1BQU0sSUFBSTttQkFDVixPQUFPLEtBQVEsY0FBYyxLQUFLLE1BQU8sS0FBSyxVQUFVOztRQUU1RCxRQUFROzs7O1lBRUosTUFBTSxJQUFJO21CQUNWLE9BQU8sR0FBRyxJQUFJLFNBQVMsU0FBVTs7O0lBRXpDLEtBQUs7Ozs7UUFFRCxNQUFNLElBQUk7UUFFVixPQUFPLEdBQUcsSUFBSSxTQUFTO1FBQ3ZCLE9BQU8sR0FBRyxJQUFJLFNBQVM7ZUFDdkIsT0FBTyxHQUFHLElBQUksU0FBUzs7SUFFM0IsS0FBSzs7OztRQUVELFdBQVcsR0FBRyxPQUFPO1FBQ3JCLE1BQU0sSUFBSSxHQUFJLFNBQVUsWUFBYyxNQUFPLEdBQUksTUFBTztRQUV4RCxPQUFPLEtBQVEsY0FBYyxLQUFLLE1BQU8sS0FBSyxVQUFVO2VBQ3hELE9BQU8sR0FBRyxJQUFJLFNBQVMsTUFBTSxjQUFjLFFBQVEsS0FBTSxVQUFXLEtBQUssVUFBVTs7SUFFdkYsS0FBSzs7OztRQUVELFdBQ0ssS0FBTSxPQUFRLEtBQU0sUUFBUyxNQUFPLEtBQU0sUUFBUyxnQkFDbkQsS0FBTSxTQUFVLEtBQU0sUUFBUyxLQUFNLEtBQU0sV0FBWTtRQUc1RCxNQUFNLE9BQU8sYUFBYSxPQUFRO1FBRWxDLE9BQU8sS0FBUSxjQUFjLEtBQUssTUFBTyxLQUFLLFVBQVU7ZUFDeEQsT0FBTyxHQUFHLElBQUksU0FBUyxpQkFBa0IsS0FBSyxVQUFVOztJQUU1RCxLQUFLOzs7O1FBRUQsV0FDSyxLQUFNLE9BQVEsS0FBTSxPQUFRLE1BQU8sS0FBTSxRQUFTLFVBQ2xELEtBQU0sU0FBVSxLQUFNLE9BQVEsS0FBTSxPQUFRLFdBQVk7UUFHN0QsTUFBTSxPQUFPLGFBQWEsT0FBUTtRQUVsQyxPQUFPLEtBQVEsY0FBYyxLQUFLLE1BQU8sS0FBSyxVQUFVO2VBQ3hELE9BQU8sR0FBRyxJQUFJLFNBQVMsbUJBQW9CLEtBQUssVUFBVTs7SUFFOUQsS0FBSzs7OztRQUVELFdBQ0ksR0FBSSxNQUFNLGdCQUNWLE9BQVEsS0FBSyxPQUFPLE1BQU0sS0FDMUIsYUFBYyxjQUNkLGFBQWMsZ0JBQWdCLE1BQzlCLFVBQVcsZ0JBQWdCLE1BQzNCLE1BQU87UUFFWCxNQUFNLE9BQU8sY0FBYyxRQUFTLEdBQUk7UUFFeEMsT0FBTyxLQUFRLGNBQWMsS0FBSyxNQUFPLEtBQUssVUFBVTtlQUN4RCxPQUFPLE1BQU0sSUFBSSxPQUFROztXQUU3QixLQUFLOzs7O1FBRUQsTUFBTSxJQUFJO2VBQ1YsT0FBTyxHQUFHLElBQUksU0FBUyxpREFBa0QsS0FBSyxVQUFVIn0=
//# sourceURL=file://kode/test/control.test.kode
