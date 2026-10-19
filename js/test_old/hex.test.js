var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var lit, plain, strip

import test from 'node:test'
import assert from 'node:assert/strict'
import style from "../style.js"


strip = function (text)
{
    return text.replace(/\x1b\[[0-9;]*m/g,'')
}
lit = style.createStyle(true)
plain = style.createStyle(false)
test.describe('fg and bg with hex',function ()
{
    test('fg emits a 24-bit foreground sequence',function ()
    {
        return assert.equal(lit.fg('#0000ff','x'),"\u001b[38;2;0;0;255mx\u001b[39m")
    })
    test('bg emits a 24-bit background sequence',function ()
    {
        return assert.equal(lit.bg('#ff0000','x'),"\u001b[48;2;255;0;0mx\u001b[49m")
    })
    test('three digit shorthand expands to pairs',function ()
    {
        assert.equal(lit.fg('#00f','x'),lit.fg('#0000ff','x'))
        return assert.equal(lit.bg('#f00','x'),lit.bg('#ff0000','x'))
    })
    test('uppercase and a missing hash are accepted',function ()
    {
        assert.equal(lit.fg('#0000FF','x'),lit.fg('#0000ff','x'))
        return assert.equal(lit.fg('00ff00','x'),lit.fg('#00ff00','x'))
    })
    test('four digits are rejected as neither rgb nor rrggbb',function ()
    {
        return assert.throws(function ()
        {
            lit.fg('#00FF','x')
            return style.StyleError
        })
    })
    test('nesting preserves the visible text',function ()
    {
        var out

        out = lit.bg('#ff0000',lit.fg('#ffff00','hi'))
        return assert.equal(strip(out),'hi')
    })
    test('fg nests inside another role',function ()
    {
        var out

        out = lit.fg('#0000ff',lit.turn.user('> user'))
        assert.equal(strip(out),'> user')
        assert.ok(out.includes,'38;2;0;0;255')
        return assert.notEqual(out,lit.turn.user('> user'))
    })
    return test('a role can be built from hex, foreground inside background',function ()
    {
        var c

        c = function (text)
        {
            return lit.bg('#1e40af',lit.fg('#ffffff',lit.turn.user(text)))
        }
        assert.equal(strip(c('> user')),'> user')
        return assert.ok((c('> user')).includes,'48;2;30;64;175')
    })
})
test.describe('fg and bg when color is off',function ()
{
    test('fg returns the text, not the hex',function ()
    {
        return assert.equal(plain.fg('#0000ff','hello'),'hello')
    })
    test('bg returns the text, not the hex',function ()
    {
        return assert.equal(plain.bg('#ff0000','hello'),'hello')
    })
    test('no escape codes are emitted',function ()
    {
        assert.equal(strip(plain.fg('#0000ff','x')),'x')
        return assert.equal(strip(plain.bg('#ff0000','x')),'x')
    })
    return test('a role using fg does not leak the hex when color is off',function ()
    {
        var name

        name = function (text)
        {
            return plain.fg('#00ff00',text)
        }
        return assert.equal(name('name'),'name')
    })
})
test.describe('palette',function ()
{
    test('exposes the named codes alongside fg and bg',function ()
    {
        assert.equal(typeof(lit.palette.bold),'function')
        assert.equal(typeof(lit.palette.gray),'function')
        assert.equal(typeof(lit.palette.fg),'function')
        return assert.equal(typeof(lit.palette.bg),'function')
    })
    test('fg composes with a named code the way a role author writes it',function ()
    {
        var out

        out = lit.fg('#0000ff',lit.palette.bold('hi'))
        assert.equal(strip(out),'hi')
        assert.ok(out.includes,'38;2;0;0;255')
        return assert.ok(out.includes,"\u001b[1m")
    })
    test('bg composes with fg for a foreground on a background',function ()
    {
        var out

        out = lit.bg('#ff0000',lit.fg('#ffff00','hi'))
        assert.equal(strip(out),'hi')
        assert.ok(out.includes,'48;2;255;0;0')
        return assert.ok(out.includes,'38;2;255;255;0')
    })
    return test('the palette follows the color setting too',function ()
    {
        assert.equal(plain.palette.bold('hi'),'hi')
        return assert.notEqual(lit.palette.bold('hi'),'hi')
    })
})
test.describe('hex validation',function ()
{
    var bad, value

    bad = ['#12345','#1234567','#gggggg','blue','','#']
    var list = _k_.list(bad)
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        value = list[_a_]
        test(`rejects ${JSON.stringify(value)}`,function ()
        {
            return assert.throws(function ()
            {
                lit.fg(value,'x')
                return style.StyleError
            })
        })
    }
    test('rejects a non-string',function ()
    {
        assert.throws(function ()
        {
            lit.fg(255,'x')
            return style.StyleError
        })
        return assert.throws(function ()
        {
            lit.bg(null,'x')
            return style.StyleError
        })
    })
    test('rejects eight digit hex with a message mentioning alpha',function ()
    {
        return assert.throws(function ()
        {
            lit.fg('#0000ffff','x')
            return /hex|rgb/i
        })
    })
    test('the error names the offending value',function ()
    {
        return assert.throws(function ()
        {
            lit.fg('#zzzzzz','x')
            return /#zzzzzz/
        })
    })
    return test('nothing is validated while color is off, since nothing is applied',function ()
    {
        return assert.equal(plain.fg('nope','x'),'x')
    })
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGV4LnRlc3QuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdF9vbGQvaGV4LnRlc3Qua29kZSJdLCJtYXBwaW5ncyI6Ijs7OztPQVdPLEtBQUssS0FBSztPQUNWLE9BQU8sS0FBSzs7OztBQUluQjs7V0FBa0IsS0FBSyxRQUFRLGtCQUFtQjs7QUFFbEQsTUFBTSxNQUFNLFlBQVk7QUFDeEIsUUFBUSxNQUFNLFlBQVk7QUFFMUIsS0FBSyxTQUFTOztJQUVWLEtBQUs7O2VBRUQsT0FBTyxNQUFNLElBQUksR0FBRyxVQUFXLEtBQU07O0lBRXpDLEtBQUs7O2VBRUQsT0FBTyxNQUFNLElBQUksR0FBRyxVQUFXLEtBQU07O0lBRXpDLEtBQUs7O1FBRUQsT0FBTyxNQUFNLElBQUksR0FBRyxPQUFRLEtBQU0sSUFBSSxHQUFHLFVBQVc7ZUFDcEQsT0FBTyxNQUFNLElBQUksR0FBRyxPQUFRLEtBQU0sSUFBSSxHQUFHLFVBQVc7O0lBRXhELEtBQUs7O1FBRUQsT0FBTyxNQUFNLElBQUksR0FBRyxVQUFXLEtBQU0sSUFBSSxHQUFHLFVBQVc7ZUFDdkQsT0FBTyxNQUFNLElBQUksR0FBRyxTQUFVLEtBQU0sSUFBSSxHQUFHLFVBQVc7O0lBRTFELEtBQUs7O2VBRUQsT0FBTzs7WUFBVSxJQUFJLEdBQUcsUUFBUzttQkFBTSxNQUFNOzs7SUFFakQsS0FBSzs7OztRQUVELE1BQU0sSUFBSSxHQUFHLFVBQVcsSUFBSSxHQUFHLFVBQVc7ZUFDMUMsT0FBTyxNQUFNLE1BQU0sS0FBTTs7SUFFN0IsS0FBSzs7OztRQUVELE1BQU0sSUFBSSxHQUFHLFVBQVcsSUFBSSxLQUFLLEtBQUs7UUFFdEMsT0FBTyxNQUFNLE1BQU0sS0FBTTtRQUN6QixPQUFPLEdBQUcsSUFBSSxTQUFTO2VBQ3ZCLE9BQU8sU0FBUyxJQUFLLElBQUksS0FBSyxLQUFLOztXQUV2QyxLQUFLOzs7O1FBRUQ7O21CQUFjLElBQUksR0FBRyxVQUFXLElBQUksR0FBRyxVQUFXLElBQUksS0FBSyxLQUFLOztRQUVoRSxPQUFPLE1BQU0sTUFBTSxFQUFFLFdBQVk7ZUFDakMsT0FBTyxJQUFJLEVBQUUsV0FBVyxTQUFTOzs7QUFRekMsS0FBSyxTQUFTOztJQUVWLEtBQUs7O2VBRUQsT0FBTyxNQUFNLE1BQU0sR0FBRyxVQUFXLFNBQVU7O0lBRS9DLEtBQUs7O2VBRUQsT0FBTyxNQUFNLE1BQU0sR0FBRyxVQUFXLFNBQVU7O0lBRS9DLEtBQUs7O1FBRUQsT0FBTyxNQUFNLE1BQU0sTUFBTSxHQUFHLFVBQVcsTUFBTztlQUM5QyxPQUFPLE1BQU0sTUFBTSxNQUFNLEdBQUcsVUFBVyxNQUFPOztXQUVsRCxLQUFLOzs7O1FBRUQ7O21CQUFpQixNQUFNLEdBQUcsVUFBVzs7ZUFDckMsT0FBTyxNQUFNLEtBQUssUUFBUzs7O0FBUW5DLEtBQUssU0FBUzs7SUFFVixLQUFLOztRQUVELE9BQU8sTUFBTSxPQUFPLElBQUksUUFBUSxNQUFPO1FBQ3ZDLE9BQU8sTUFBTSxPQUFPLElBQUksUUFBUSxNQUFPO1FBQ3ZDLE9BQU8sTUFBTSxPQUFPLElBQUksUUFBUSxJQUFLO2VBQ3JDLE9BQU8sTUFBTSxPQUFPLElBQUksUUFBUSxJQUFLOztJQUV6QyxLQUFLOzs7O1FBRUQsTUFBTSxJQUFJLEdBQUcsVUFBVyxJQUFJLFFBQVEsS0FBSztRQUV6QyxPQUFPLE1BQU0sTUFBTSxLQUFNO1FBQ3pCLE9BQU8sR0FBRyxJQUFJLFNBQVM7ZUFDdkIsT0FBTyxHQUFHLElBQUksU0FBUzs7SUFFM0IsS0FBSzs7OztRQUVELE1BQU0sSUFBSSxHQUFHLFVBQVcsSUFBSSxHQUFHLFVBQVc7UUFFMUMsT0FBTyxNQUFNLE1BQU0sS0FBTTtRQUN6QixPQUFPLEdBQUcsSUFBSSxTQUFTO2VBQ3ZCLE9BQU8sR0FBRyxJQUFJLFNBQVM7O1dBRTNCLEtBQUs7O1FBRUQsT0FBTyxNQUFNLE1BQU0sUUFBUSxLQUFLLE1BQU87ZUFDdkMsT0FBTyxTQUFTLElBQUksUUFBUSxLQUFLLE1BQU87OztBQVFoRCxLQUFLLFNBQVM7Ozs7SUFFVixPQUFPLFNBQVMsV0FBVyxVQUFVLE9BQU8sR0FBRzt3QkFFbEM7Ozs7UUFDVCxnQkFBZ0IsS0FBSyxVQUFVOzttQkFDM0IsT0FBTzs7Z0JBQVUsSUFBSSxHQUFHLE1BQU87dUJBQU0sTUFBTTs7OztJQUVuRCxLQUFLOztRQUVELE9BQU87O1lBQVUsSUFBSSxHQUFHLElBQUs7bUJBQU0sTUFBTTs7ZUFDekMsT0FBTzs7WUFBVSxJQUFJLEdBQUcsS0FBTTttQkFBTSxNQUFNOzs7SUFFOUMsS0FBSzs7ZUFFRCxPQUFPOztZQUFVLElBQUksR0FBRyxZQUFhO21CQUFNOzs7SUFFL0MsS0FBSzs7ZUFFRCxPQUFPOztZQUFVLElBQUksR0FBRyxVQUFXO21CQUFNOzs7V0FFN0MsS0FBSzs7ZUFFRCxPQUFPLE1BQU0sTUFBTSxHQUFHLE9BQVEsS0FBTSJ9
//# sourceURL=file://kode/test_old/hex.test.kode
