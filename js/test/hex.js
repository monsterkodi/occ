var toExport = {}
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var bad, c, isStyleError, lit, name, out, plain, strip, value

import style from "../style.js"

import utils from "./utils.js"
let throws = utils.throws


strip = function (text)
{
    return text.replace(/\x1b\[[0-9;]*m/g,'')
}
lit = style.createStyle(true)
plain = style.createStyle(false)

isStyleError = function (e)
{
    return e instanceof style.StyleError
}
toExport["fg and bg with hex"] = function ()
{
    section("fg emits a 24-bit foreground sequence", function ()
    {
        compare((lit.fg('#0000ff','x')),"\u001b[38;2;0;0;255mx\u001b[39m")
    })
    section("bg emits a 24-bit background sequence", function ()
    {
        compare((lit.bg('#ff0000','x')),"\u001b[48;2;255;0;0mx\u001b[49m")
    })
    section("three digit shorthand expands to pairs", function ()
    {
        compare((lit.fg('#00f','x')),(lit.fg('#0000ff','x')))
        compare((lit.bg('#f00','x')),(lit.bg('#ff0000','x')))
    })
    section("uppercase and a missing hash are accepted", function ()
    {
        compare((lit.fg('#0000FF','x')),(lit.fg('#0000ff','x')))
        compare((lit.fg('00ff00','x')),(lit.fg('#00ff00','x')))
    })
    section("four digits are rejected as neither rgb nor rrggbb", function ()
    {
        throws((function ()
        {
            return lit.fg('#00FF','x')
        }),isStyleError)
    })
    section("nesting preserves the visible text", function ()
    {
        out = lit.bg('#ff0000',lit.fg('#ffff00','hi'))
        compare((strip(out)),'hi')
    })
    section("fg nests inside another role", function ()
    {
        out = lit.fg('#0000ff',lit.turn.user('> user'))
        compare((strip(out)),'> user')
        compare((out.includes('38;2;0;0;255')),true)
        compare(out !== lit.turn.user('> user'),true)
    })
    section("a role can be built from hex, foreground inside background", function ()
    {
        c = function (text)
        {
            return lit.bg('#1e40af',lit.fg('#ffffff',lit.turn.user(text)))
        }
        compare((strip(c('> user'))),'> user')
        compare(((c('> user')).includes('48;2;30;64;175')),true)
    })
}
toExport["fg and bg with hex"]._section_ = true
toExport["fg and bg when color is off"] = function ()
{
    section("fg returns the text, not the hex", function ()
    {
        compare((plain.fg('#0000ff','hello')),'hello')
    })
    section("bg returns the text, not the hex", function ()
    {
        compare((plain.bg('#ff0000','hello')),'hello')
    })
    section("no escape codes are emitted", function ()
    {
        compare((strip(plain.fg('#0000ff','x'))),'x')
        compare((strip(plain.bg('#ff0000','x'))),'x')
    })
    section("a role using fg does not leak the hex when color is off", function ()
    {
        name = function (text)
        {
            return plain.fg('#00ff00',text)
        }
        compare((name('name')),'name')
    })
}
toExport["fg and bg when color is off"]._section_ = true
toExport["palette"] = function ()
{
    section("exposes the named codes alongside fg and bg", function ()
    {
        compare(typeof(lit.palette.bold),'function')
        compare(typeof(lit.palette.gray),'function')
        compare(typeof(lit.palette.fg),'function')
        compare(typeof(lit.palette.bg),'function')
    })
    section("fg composes with a named code the way a role author writes it", function ()
    {
        out = lit.fg('#0000ff',lit.palette.bold('hi'))
        compare((strip(out)),'hi')
        compare((out.includes('38;2;0;0;255')),true)
        compare((out.includes("\u001b[1m")),true)
    })
    section("bg composes with fg for a foreground on a background", function ()
    {
        out = lit.bg('#ff0000',lit.fg('#ffff00','hi'))
        compare((strip(out)),'hi')
        compare((out.includes('48;2;255;0;0')),true)
        compare((out.includes('38;2;255;255;0')),true)
    })
    section("the palette follows the color setting too", function ()
    {
        compare((plain.palette.bold('hi')),'hi')
        compare(lit.palette.bold('hi') !== 'hi',true)
    })
}
toExport["palette"]._section_ = true
toExport["hex validation"] = function ()
{
    bad = ['#12345','#1234567','#gggggg','blue','','#']
    section("rejects each malformed hex value", function ()
    {
        var list = _k_.list(bad)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            value = list[_a_]
            throws((function ()
            {
                return lit.fg(value,'x')
            }),isStyleError)
        }
    })
    section("rejects a non-string", function ()
    {
        throws((function ()
        {
            return lit.fg(255,'x')
        }),isStyleError)
        throws((function ()
        {
            return lit.bg(null,'x')
        }),isStyleError)
    })
    section("rejects eight digit hex with a message mentioning alpha", function ()
    {
        throws((function ()
        {
            return lit.fg('#0000ffff','x')
        }),/hex|rgb/i)
    })
    section("the error names the offending value", function ()
    {
        throws((function ()
        {
            return lit.fg('#zzzzzz','x')
        }),/#zzzzzz/)
    })
    section("nothing is validated while color is off, since nothing is applied", function ()
    {
        compare((plain.fg('nope','x')),'x')
    })
}
toExport["hex validation"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGV4LmpzIiwic291cmNlcyI6WyIuLi8uLi9rb2RlL3Rlc3QvaGV4LmtvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBY0E7O1dBQWtCLEtBQUssUUFBUSxrQkFBbUI7O0FBRWxELE1BQU0sTUFBTSxZQUFZO0FBQ3hCLFFBQVEsTUFBTSxZQUFZOztBQU0xQjs7V0FBc0IsYUFBYSxNQUFNOzs7Ozs7aUJBTWhDLElBQUksR0FBRyxVQUFXLE1BQVE7Ozs7aUJBSTFCLElBQUksR0FBRyxVQUFXLE1BQVE7Ozs7aUJBSTFCLElBQUksR0FBRyxPQUFRLE9BQVMsSUFBSSxHQUFHLFVBQVc7aUJBQzFDLElBQUksR0FBRyxPQUFRLE9BQVMsSUFBSSxHQUFHLFVBQVc7Ozs7aUJBSTFDLElBQUksR0FBRyxVQUFXLE9BQVMsSUFBSSxHQUFHLFVBQVc7aUJBQzdDLElBQUksR0FBRyxTQUFVLE9BQVMsSUFBSSxHQUFHLFVBQVc7Ozs7UUFJN0M7O21CQUFXLElBQUksR0FBRyxRQUFTO1dBQU87Ozs7UUFJbEMsTUFBTSxJQUFJLEdBQUcsVUFBVyxJQUFJLEdBQUcsVUFBVztpQkFDekMsTUFBTSxNQUFROzs7O1FBSWYsTUFBTSxJQUFJLEdBQUcsVUFBVyxJQUFJLEtBQUssS0FBSztpQkFFckMsTUFBTSxNQUFRO2lCQUNkLElBQUksU0FBUyxpQkFBbUI7Z0JBQ2pDLFFBQU8sSUFBSSxLQUFLLEtBQUssVUFBWTs7OztRQUlqQzs7bUJBQWMsSUFBSSxHQUFHLFVBQVcsSUFBSSxHQUFHLFVBQVcsSUFBSSxLQUFLLEtBQUs7O2lCQUUvRCxNQUFNLEVBQUUsWUFBYztrQkFDckIsRUFBRSxXQUFXLFNBQVMsbUJBQXFCOzs7Ozs7OztpQkFZNUMsTUFBTSxHQUFHLFVBQVcsVUFBWTs7OztpQkFJaEMsTUFBTSxHQUFHLFVBQVcsVUFBWTs7OztpQkFJaEMsTUFBTSxNQUFNLEdBQUcsVUFBVyxPQUFTO2lCQUNuQyxNQUFNLE1BQU0sR0FBRyxVQUFXLE9BQVM7Ozs7UUFJcEM7O21CQUFpQixNQUFNLEdBQUcsVUFBVzs7aUJBQ3BDLEtBQUssU0FBVzs7Ozs7Ozs7Z0JBWWpCLE9BQU8sSUFBSSxRQUFRLE1BQVE7Z0JBQzNCLE9BQU8sSUFBSSxRQUFRLE1BQVE7Z0JBQzNCLE9BQU8sSUFBSSxRQUFRLElBQU07Z0JBQ3pCLE9BQU8sSUFBSSxRQUFRLElBQU07Ozs7UUFJekIsTUFBTSxJQUFJLEdBQUcsVUFBVyxJQUFJLFFBQVEsS0FBSztpQkFFeEMsTUFBTSxNQUFRO2lCQUNkLElBQUksU0FBUyxpQkFBbUI7aUJBQ2hDLElBQUksU0FBUyxjQUFnQjs7OztRQUk5QixNQUFNLElBQUksR0FBRyxVQUFXLElBQUksR0FBRyxVQUFXO2lCQUV6QyxNQUFNLE1BQVE7aUJBQ2QsSUFBSSxTQUFTLGlCQUFtQjtpQkFDaEMsSUFBSSxTQUFTLG1CQUFxQjs7OztpQkFJbEMsTUFBTSxRQUFRLEtBQUssT0FBUztnQkFDN0IsSUFBSSxRQUFRLEtBQUssVUFBUyxLQUFPOzs7Ozs7SUFVckMsT0FBTyxTQUFTLFdBQVcsVUFBVSxPQUFPLEdBQUc7Ozs0QkFJOUI7Ozs7WUFDVDs7dUJBQVcsSUFBSSxHQUFHLE1BQU87ZUFBTzs7Ozs7UUFJcEM7O21CQUFXLElBQUksR0FBRyxJQUFLO1dBQU87UUFDOUI7O21CQUFXLElBQUksR0FBRyxLQUFNO1dBQU87Ozs7UUFJL0I7O21CQUFXLElBQUksR0FBRyxZQUFhO1dBQU87Ozs7UUFJdEM7O21CQUFXLElBQUksR0FBRyxVQUFXO1dBQU87Ozs7aUJBSW5DLE1BQU0sR0FBRyxPQUFRLE1BQVEifQ==
//# sourceURL=file://kode/test/hex.kode
