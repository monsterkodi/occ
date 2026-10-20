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
toExport["escapeControl"] = async function ()
{
    await section("leaves printable text alone", async function ()
    {
        compare((escape('plain text 123 !?')),'plain text 123 !?')
    })
    await section("keeps tab and newline, since they are layout, not noise", async function ()
    {
        compare((escape("a\tb\nc")),"a\tb\nc")
    })
    await section("escapes nul as a hex byte", async function ()
    {
        compare((escape("a\0b")),'a\\x00b')
    })
    await section("escapes every other c0 control as hex", async function ()
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
    await section("escapes delete", async function ()
    {
        compare((escape("a\u007fb")),'a\\x7fb')
    })
    await section("keeps the ansi escape byte, since colors are output to keep", async function ()
    {
        compare((escape("\u001b[31mred\u001b[39m")),"\u001b[31mred\u001b[39m")
    })
    await section("leaves multibyte text untouched", async function ()
    {
        compare((escape('héllo → 🎉')),'héllo → 🎉')
    })
    await section("coerces a non-string", async function ()
    {
        compare((escape(42)),'42')
        compare((escape(null)),'null')
    })
    await section("output never carries a control byte other than tab and newline", async function ()
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
toExport["control bytes in a session"] = async function ()
{
    await section("the raw fixture result really does contain the offending bytes", async function ()
    {
        compare((bytesOf(build.CONTROL_RESULT).includes(0x00)),true)
        compare((bytesOf(build.CONTROL_TITLE).includes(0x00)),true)
    })
    await section("shell and log output holds no control byte and shows the nul bytes", async function ()
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
    await section("the escaped result keeps its tabs, newlines and colors", async function ()
    {
        out = run(shell)
        compare((out.includes("tab\there")),true)
        compare((out.includes("<anonymous_script>:1\n")),true)
        compare((out.includes("\u001b[31mred\u001b[39m")),true)
    })
    await section("a session title with control bytes is escaped in the table", async function ()
    {
        database = db.openDb(CONTROL_DB_PATH)
        out = ls({db:database,prefixes:[],width:80,style:plain})
        compare(!(CONTROL_BYTES.test(out)),true)
        compare((out.includes(build.CONTROL_TITLE.replace("\0",'\\x00'))),true)
    })
    await section("a command carrying control bytes is escaped too", async function ()
    {
        blocks = [{kind:'call',name:'shell',agent:null,command:"printf '\0'"},{kind:'result',name:'shell',text:'ok',outputPath:null}]
        out = render.renderBlocks(blocks,plain)
        compare(!(CONTROL_BYTES.test(out)),true)
        compare((out.includes("printf '\\x00'")),true)
    })
    await section("a truncated result's output path is escaped as well", async function ()
    {
        blocks = [{kind:'call',name:'read',agent:null,command:'cat f'},{kind:'result',name:'read',text:'head',outputPath:"/tmp/out\0put"}]
        out = render.renderBlocks(blocks,plain)
        compare(!(CONTROL_BYTES.test(out)),true)
        compare((out.includes('/tmp/out\\x00put')),true)
    })
    await section("the row renderer escapes a title before it is cropped", async function ()
    {
        session = {id:build.CONTROL_SESSION,title:("x").repeat(79) + "\0",time_created:1791283494422,time_updated:1791283494422 + 60000,time_last:1791283494422 + 60000,turns:1}
        out = render.renderSession(session,80,plain)
        compare(!(CONTROL_BYTES.test(out)),true)
        compare(out.length,80)
    })
    await section("escaping survives the round trip through the database", async function ()
    {
        out = run(shell)
        compare((out.includes('\\x00\\x00\\x00 \\x08\\x10\\x00\\x040\\x00\\x00')),true)
    })
}
toExport["control bytes in a session"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbC5qcyIsInNvdXJjZXMiOlsiLi4vLi4va29kZS90ZXN0L2NvbnRyb2wua29kZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBV0Esa0JBQWtCLE1BQU0sV0FBVztBQUVuQyxRQUFRLE1BQU0sWUFBWTtBQUsxQixnQkFBZ0I7QUFJaEIsVUFBVTs7QUFFVjs7OztJQUVJLFdBQVcsR0FBRyxPQUFPO1FBRWxCLFlBQVc7O1FBQWEsU0FBUyxHQUFJLFNBQVUsVUFBVyxVQUFXLE1BQU8sR0FBSSxNQUFPOztXQUMxRixTQUFTLEdBQUksU0FBVSxVQUFXLFVBQVcsTUFBTyxHQUFJLE1BQU87OztBQUVuRTs7V0FBb0IsTUFBTSxLQUFLLE9BQU8sS0FBSyxLQUFNOzs7Ozs7aUJBT3hDLE9BQU8sc0JBQXdCOzs7O2lCQUkvQixPQUFPLFlBQWM7Ozs7aUJBSXJCLE9BQU8sU0FBVzs7OztRQUluQixNQUFNLE1BQU0sTUFBTSxPQUFROzttQkFBaUIsT0FBTyxhQUFhOztRQUMvRCxLQUFLLElBQUk7O3FCQUFtQixjQUFjLFNBQVM7V0FBSSxLQUFLOzRCQUVuRDs7OztZQUNMLE1BQU0sRUFBRSxXQUFXLEdBQUcsU0FBUyxJQUFJLFNBQVMsRUFBRztxQkFDOUMsV0FBVyxjQUFnQjs7Ozs7aUJBSS9CLE9BQU8sYUFBZTs7OztpQkFJdEIsT0FBTyw0QkFBOEI7Ozs7aUJBSXJDLE9BQU8sZUFBaUI7Ozs7aUJBSXhCLE9BQU8sS0FBTztpQkFDZCxPQUFPLE9BQVM7Ozs7NkJBSVIsTUFBTSxNQUFNLE9BQVE7O21CQUFpQixPQUFPLGFBQWE7Ozs7O1lBQzlELE1BQU0sV0FBVztZQUNqQixNQUFNLFFBQVEsS0FBSzs7b0JBQ1osTUFBSyxRQUFRLE1BQUssUUFBUSxNQUFLOzsyQkFBVTs7OzsyQkFBVyxJQUFJLFFBQVEsTUFBSzs7O29CQUM1RTs7Ozs7Ozs7O2lCQVlILFFBQVEsTUFBTSxnQkFBZ0IsU0FBUyxPQUFTO2lCQUNoRCxRQUFRLE1BQU0sZUFBZSxTQUFTLE9BQVM7Ozs7c0JBSWpDLFFBQVMsUUFBUSxNQUFPOzs7O3NCQUNqQjs7WUFFbEIsTUFBTSxJQUFJO3NCQUNMLGNBQWMsS0FBSyxNQUFRO1lBRWhDLE1BQU0sSUFBSTtxQkFDVCxJQUFJLFNBQVMsVUFBWTs7Ozs7UUFJOUIsTUFBTSxJQUFJO2lCQUVULElBQUksU0FBUyxjQUFnQjtpQkFDN0IsSUFBSSxTQUFTLDJCQUE2QjtpQkFDMUMsSUFBSSxTQUFTLDRCQUE4Qjs7OztRQUk1QyxXQUFXLEdBQUcsT0FBTztRQUNyQixNQUFNLElBQUksR0FBSSxTQUFVLFlBQWMsTUFBTyxHQUFJLE1BQU87a0JBRW5ELGNBQWMsS0FBSyxNQUFRO2lCQUMvQixJQUFJLFNBQVMsTUFBTSxjQUFjLFFBQVEsS0FBTSxXQUFhOzs7O1FBSTdELFdBQ0ssS0FBTSxPQUFRLEtBQU0sUUFBUyxNQUFPLEtBQU0sUUFBUyxnQkFDbkQsS0FBTSxTQUFVLEtBQU0sUUFBUyxLQUFNLEtBQU0sV0FBWTtRQUc1RCxNQUFNLE9BQU8sYUFBYSxPQUFRO2tCQUU3QixjQUFjLEtBQUssTUFBUTtpQkFDL0IsSUFBSSxTQUFTLG1CQUFxQjs7OztRQUluQyxXQUNLLEtBQU0sT0FBUSxLQUFNLE9BQVEsTUFBTyxLQUFNLFFBQVMsVUFDbEQsS0FBTSxTQUFVLEtBQU0sT0FBUSxLQUFNLE9BQVEsV0FBWTtRQUc3RCxNQUFNLE9BQU8sYUFBYSxPQUFRO2tCQUU3QixjQUFjLEtBQUssTUFBUTtpQkFDL0IsSUFBSSxTQUFTLHFCQUF1Qjs7OztRQUlyQyxXQUNJLEdBQUksTUFBTSxnQkFDVixPQUFRLEtBQUssT0FBTyxNQUFNLEtBQzFCLGFBQWMsY0FDZCxhQUFjLGdCQUFnQixNQUM5QixVQUFXLGdCQUFnQixNQUMzQixNQUFPO1FBRVgsTUFBTSxPQUFPLGNBQWMsUUFBUyxHQUFJO2tCQUVuQyxjQUFjLEtBQUssTUFBUTtnQkFDaEMsSUFBSSxPQUFTOzs7O1FBSWIsTUFBTSxJQUFJO2lCQU1ULElBQUksU0FBUyxvREFBc0QifQ==
//# sourceURL=file:///home/kodi/s/occ/kode/test/control.kode
