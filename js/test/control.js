var toExport = {}
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var all, bad, blocks, bytesOf, c, c0, command, CONTROL_BYTES, CONTROL_DB_PATH, database, entry, hex, history, name, out, plain, run, session

import build from "../test/fixtures/build.js"

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
toExport["escapeControl"] = function ()
{
    section("leaves printable text alone", function ()
    {
        compare((escape('plain text 123 !?')),'plain text 123 !?')
    })
    section("keeps tab and newline, since they are layout, not noise", function ()
    {
        compare((escape("a\tb\nc")),"a\tb\nc")
    })
    section("escapes nul as a hex byte", function ()
    {
        compare((escape("a\0b")),'a\\x00b')
    })
    section("escapes every other c0 control as hex", function ()
    {
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
            compare((escape(`a${c}b`)),`a\\x${hex}b`)
        }
    })
    section("escapes delete", function ()
    {
        compare((escape("a\u007fb")),'a\\x7fb')
    })
    section("keeps the ansi escape byte, since colors are output to keep", function ()
    {
        compare((escape("\u001b[31mred\u001b[39m")),"\u001b[31mred\u001b[39m")
    })
    section("leaves multibyte text untouched", function ()
    {
        compare((escape('héllo → 🎉')),'héllo → 🎉')
    })
    section("coerces a non-string", function ()
    {
        compare((escape(42)),'42')
        compare((escape(null)),'null')
    })
    section("output never carries a control byte other than tab and newline", function ()
    {
        var list1 = _k_.list(Array.from({length:0x80},function (_, i)
        {
            return String.fromCharCode(i)
        }))
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            c = list1[_b_]
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
            compare(bad,[])
        }
    })
}
toExport["escapeControl"]._section_ = true
toExport["control bytes in a session"] = function ()
{
    section("the raw fixture result really does contain the offending bytes", function ()
    {
        compare((bytesOf(build.CONTROL_RESULT).includes(0x00)),true)
        compare((bytesOf(build.CONTROL_TITLE).includes(0x00)),true)
    })
    section("shell and log output holds no control byte and shows the nul bytes", function ()
    {
        var list2 = [['shell',shell],['log',history]]
        for (var _c_ = 0; _c_ < list2.length; _c_++)
        {
            entry = list2[_c_]
            var _d_ = entry; name = _d_[0]; command = _d_[1]

            out = run(command)
            compare(!(CONTROL_BYTES.test(out)),true)
            out = run(command)
            compare((out.includes('\\x00')),true)
        }
    })
    section("the escaped result keeps its tabs, newlines and colors", function ()
    {
        out = run(shell)
        compare((out.includes("tab\there")),true)
        compare((out.includes("<anonymous_script>:1\n")),true)
        compare((out.includes("\u001b[31mred\u001b[39m")),true)
    })
    section("a session title with control bytes is escaped in the table", function ()
    {
        database = db.openDb(CONTROL_DB_PATH)
        out = ls({db:database,prefixes:[],width:80,style:plain})
        compare(!(CONTROL_BYTES.test(out)),true)
        compare((out.includes(build.CONTROL_TITLE.replace("\0",'\\x00'))),true)
    })
    section("a command carrying control bytes is escaped too", function ()
    {
        blocks = [{kind:'call',name:'shell',agent:null,command:"printf '\0'"},{kind:'result',name:'shell',text:'ok',outputPath:null}]
        out = render.renderBlocks(blocks,plain)
        compare(!(CONTROL_BYTES.test(out)),true)
        compare((out.includes("printf '\\x00'")),true)
    })
    section("a truncated result's output path is escaped as well", function ()
    {
        blocks = [{kind:'call',name:'read',agent:null,command:'cat f'},{kind:'result',name:'read',text:'head',outputPath:"/tmp/out\0put"}]
        out = render.renderBlocks(blocks,plain)
        compare(!(CONTROL_BYTES.test(out)),true)
        compare((out.includes('/tmp/out\\x00put')),true)
    })
    section("the row renderer escapes a title before it is cropped", function ()
    {
        session = {id:build.CONTROL_SESSION,title:("x").repeat(79) + "\0",time_created:1791283494422,time_updated:1791283494422 + 60000,time_last:1791283494422 + 60000,turns:1}
        out = render.renderSession(session,80,plain)
        compare(!(CONTROL_BYTES.test(out)),true)
        compare(out.length,80)
    })
    section("escaping survives the round trip through the database", function ()
    {
        out = run(shell)
        compare((out.includes('\\x00\\x00\\x00 \\x08\\x10\\x00\\x040\\x00\\x00')),true)
    })
}
toExport["control bytes in a session"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbC5qcyIsInNvdXJjZXMiOlsiLi4vLi4va29kZS90ZXN0L2NvbnRyb2wua29kZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBLGtCQUFrQixNQUFNLFdBQVc7QUFFbkMsUUFBUSxNQUFNLFlBQVk7QUFLMUIsZ0JBQWdCO0FBSWhCLFVBQVU7O0FBRVY7Ozs7SUFFSSxXQUFXLEdBQUcsT0FBTztRQUVsQixZQUFXOztRQUFhLFNBQVMsR0FBSSxTQUFVLFVBQVcsVUFBVyxNQUFPLEdBQUksTUFBTzs7V0FDMUYsU0FBUyxHQUFJLFNBQVUsVUFBVyxVQUFXLE1BQU8sR0FBSSxNQUFPOzs7QUFFbkU7O1dBQW9CLE1BQU0sS0FBSyxPQUFPLEtBQUssS0FBTTs7Ozs7O2lCQU94QyxPQUFPLHNCQUF3Qjs7OztpQkFJL0IsT0FBTyxZQUFjOzs7O2lCQUlyQixPQUFPLFNBQVc7Ozs7UUFJbkIsTUFBTSxNQUFNLE1BQU0sT0FBUTs7bUJBQWlCLE9BQU8sYUFBYTs7UUFDL0QsS0FBSyxJQUFJOztxQkFBbUIsY0FBYyxTQUFTO1dBQUksS0FBSzs0QkFFbkQ7Ozs7WUFDTCxNQUFNLEVBQUUsV0FBVyxHQUFHLFNBQVMsSUFBSSxTQUFTLEVBQUc7cUJBQzlDLFdBQVcsY0FBZ0I7Ozs7O2lCQUkvQixPQUFPLGFBQWU7Ozs7aUJBSXRCLE9BQU8sNEJBQThCOzs7O2lCQUlyQyxPQUFPLGVBQWlCOzs7O2lCQUl4QixPQUFPLEtBQU87aUJBQ2QsT0FBTyxPQUFTOzs7OzZCQUlSLE1BQU0sTUFBTSxPQUFROzttQkFBaUIsT0FBTyxhQUFhOzs7OztZQUM5RCxNQUFNLFdBQVc7WUFDakIsTUFBTSxRQUFRLEtBQUs7O29CQUNaLE1BQUssUUFBUSxNQUFLLFFBQVEsTUFBSzs7MkJBQVU7Ozs7MkJBQVcsSUFBSSxRQUFRLE1BQUs7OztvQkFDNUU7Ozs7Ozs7OztpQkFZSCxRQUFRLE1BQU0sZ0JBQWdCLFNBQVMsT0FBUztpQkFDaEQsUUFBUSxNQUFNLGVBQWUsU0FBUyxPQUFTOzs7O3NCQUlqQyxRQUFTLFFBQVEsTUFBTzs7OztzQkFDakI7O1lBRWxCLE1BQU0sSUFBSTtzQkFDTCxjQUFjLEtBQUssTUFBUTtZQUVoQyxNQUFNLElBQUk7cUJBQ1QsSUFBSSxTQUFTLFVBQVk7Ozs7O1FBSTlCLE1BQU0sSUFBSTtpQkFFVCxJQUFJLFNBQVMsY0FBZ0I7aUJBQzdCLElBQUksU0FBUywyQkFBNkI7aUJBQzFDLElBQUksU0FBUyw0QkFBOEI7Ozs7UUFJNUMsV0FBVyxHQUFHLE9BQU87UUFDckIsTUFBTSxJQUFJLEdBQUksU0FBVSxZQUFjLE1BQU8sR0FBSSxNQUFPO2tCQUVuRCxjQUFjLEtBQUssTUFBUTtpQkFDL0IsSUFBSSxTQUFTLE1BQU0sY0FBYyxRQUFRLEtBQU0sV0FBYTs7OztRQUk3RCxXQUNLLEtBQU0sT0FBUSxLQUFNLFFBQVMsTUFBTyxLQUFNLFFBQVMsZ0JBQ25ELEtBQU0sU0FBVSxLQUFNLFFBQVMsS0FBTSxLQUFNLFdBQVk7UUFHNUQsTUFBTSxPQUFPLGFBQWEsT0FBUTtrQkFFN0IsY0FBYyxLQUFLLE1BQVE7aUJBQy9CLElBQUksU0FBUyxtQkFBcUI7Ozs7UUFJbkMsV0FDSyxLQUFNLE9BQVEsS0FBTSxPQUFRLE1BQU8sS0FBTSxRQUFTLFVBQ2xELEtBQU0sU0FBVSxLQUFNLE9BQVEsS0FBTSxPQUFRLFdBQVk7UUFHN0QsTUFBTSxPQUFPLGFBQWEsT0FBUTtrQkFFN0IsY0FBYyxLQUFLLE1BQVE7aUJBQy9CLElBQUksU0FBUyxxQkFBdUI7Ozs7UUFJckMsV0FDSSxHQUFJLE1BQU0sZ0JBQ1YsT0FBUSxLQUFLLE9BQU8sTUFBTSxLQUMxQixhQUFjLGNBQ2QsYUFBYyxnQkFBZ0IsTUFDOUIsVUFBVyxnQkFBZ0IsTUFDM0IsTUFBTztRQUVYLE1BQU0sT0FBTyxjQUFjLFFBQVMsR0FBSTtrQkFFbkMsY0FBYyxLQUFLLE1BQVE7Z0JBQ2hDLElBQUksT0FBUzs7OztRQUliLE1BQU0sSUFBSTtpQkFNVCxJQUFJLFNBQVMsb0RBQXNEIn0=
//# sourceURL=file://kode/test/control.kode
