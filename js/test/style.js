var toExport = {}
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, isFunc: function (o) {return typeof o === 'function'}}

var a, b, fn, group, groups, HEX, inner, out, outer, role, roleOf, s, strip, walk

import style from "../style.js"


strip = function (text)
{
    return text.replace(/\x1b\[[0-9;]*m/g,'')
}
groups = ['row','turn','tool','del']
HEX = new Set(['fg','bg'])

walk = function (style, prefix = '', found = [])
{
    var key, path, value

    var list = _k_.list(Object.entries(style))
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        key = list[_a_][0]
        value = list[_a_][1]
        if (_k_.in(key,['enabled','palette']))
        {
            continue
        }
        if (HEX.has(key))
        {
            continue
        }
        path = prefix ? `${prefix}.${key}` : key
        if (_k_.isFunc(value))
        {
            found.push(path)
        }
        else
        {
            walk(value,path,found)
        }
    }
    return found
}

roleOf = function (style, path)
{
    var fn, key

    fn = style
    var list = _k_.list(path.split('.'))
    for (var _b_ = 0; _b_ < list.length; _b_++)
    {
        key = list[_b_]
        fn = fn[key]
    }
    return fn
}
toExport["createStyle"] = function ()
{
    section("exposes the same roles whether or not color is on", function ()
    {
        compare(walk(style.createStyle(true)),walk(style.createStyle(false)))
    })
    section("every role is a function of text", function ()
    {
        var list = _k_.list(walk(style.createStyle(true)))
        for (var _c_ = 0; _c_ < list.length; _c_++)
        {
            role = list[_c_]
            fn = roleOf(style.createStyle(true),role)
            compare(typeof(fn),'function')
            compare(typeof(fn('x')),'string')
        }
    })
    section("reports whether color is enabled", function ()
    {
        compare(style.createStyle(true).enabled,true)
        compare(style.createStyle(false).enabled,false)
    })
    section("each expected role exists", function ()
    {
        s = style.createStyle(true)
        var list1 = _k_.list(groups)
        for (var _d_ = 0; _d_ < list1.length; _d_++)
        {
            group = list1[_d_]
            compare(Boolean(s[group]),true)
        }
        compare(Object.keys(s.row),['id','last','duration','turns','name'])
        compare(Object.keys(s.turn),['user','agent','mode','continue'])
        compare(Object.keys(s.tool),['call','result','exit','note'])
        compare(Object.keys(s.del),['warning','question'])
    })
    section("disabled style returns the text unchanged", function ()
    {
        s = style.createStyle(false)
        var list2 = _k_.list(walk(s))
        for (var _e_ = 0; _e_ < list2.length; _e_++)
        {
            role = list2[_e_]
            compare(roleOf(s,role)('plain text'),'plain text')
        }
    })
    section("enabled style returns the same visible text", function ()
    {
        s = style.createStyle(true)
        var list3 = _k_.list(walk(s))
        for (var _f_ = 0; _f_ < list3.length; _f_++)
        {
            role = list3[_f_]
            compare(strip(roleOf(s,role)('plain text')),'plain text')
        }
    })
    section("a dim role wraps text without changing it", function ()
    {
        out = style.createStyle(true).turn.continue('…')
        compare(out !== '…',true)
        compare(strip(out),'…')
    })
    section("nested styles compose rather than replace", function ()
    {
        s = style.createStyle(true)
        inner = s.turn.mode('build')
        outer = s.tool.result(inner)
        compare(inner !== outer,true)
        compare(strip(outer).includes('build'),true)
    })
    section("styling is applied consistently across runs", function ()
    {
        a = style.createStyle(true)
        b = style.createStyle(true)
        compare(a.turn.user('> user'),b.turn.user('> user'))
    })
}
toExport["createStyle"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGUuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9zdHlsZS5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQWFBOztXQUFrQixLQUFLLFFBQVEsa0JBQW1COztBQUVsRCxVQUFVLE1BQU0sT0FBTyxPQUFPO0FBRTlCLFVBQVUsS0FBSyxLQUFNOztBQUtyQjs7Ozt3QkFFd0IsT0FBTyxRQUFROzs7OzttQkFDNUIsS0FBUSxVQUFVOztZQUFnQjs7WUFDbEMsSUFBSSxJQUFJOztZQUFTOztRQUNwQixPQUFVLFlBQWUsVUFBVSxRQUFXO3VCQUMzQzs7WUFBbUIsTUFBTSxLQUFLOzs7O1lBQzVCLEtBQUssTUFBTyxLQUFNOzs7V0FFM0I7OztBQUVKOzs7O0lBRUksS0FBSzt3QkFDTSxLQUFLLE1BQU07Ozs7UUFDbEIsS0FBSyxHQUFHOztXQUVaOzs7Ozs7Z0JBTUksS0FBSyxNQUFNLFlBQVksT0FBUyxLQUFLLE1BQU0sWUFBWTs7Ozs0QkFJM0MsS0FBSyxNQUFNLFlBQVk7Ozs7WUFDL0IsS0FBSyxPQUFPLE1BQU0sWUFBWSxNQUFPO29CQUNyQyxPQUFPLElBQU07b0JBQ2IsT0FBTyxHQUFHLE1BQVE7Ozs7O2dCQUl0QixNQUFNLFlBQVksTUFBTSxRQUFVO2dCQUNsQyxNQUFNLFlBQVksT0FBTyxRQUFVOzs7O1FBSW5DLElBQUksTUFBTSxZQUFZOzZCQUNUOzs7O29CQUNULFFBQVEsRUFBRSxRQUFVOztnQkFDeEIsT0FBTyxLQUFLLEVBQUUsTUFBUSxLQUFLLE9BQU8sV0FBVyxRQUFRO2dCQUNyRCxPQUFPLEtBQUssRUFBRSxPQUFTLE9BQU8sUUFBUSxPQUFPO2dCQUM3QyxPQUFPLEtBQUssRUFBRSxPQUFTLE9BQU8sU0FBUyxPQUFPO2dCQUM5QyxPQUFPLEtBQUssRUFBRSxNQUFRLFVBQVU7Ozs7UUFJaEMsSUFBSSxNQUFNLFlBQVk7NkJBQ1YsS0FBSzs7OztvQkFDYixPQUFPLEVBQUcsTUFBTSxjQUFnQjs7Ozs7UUFJcEMsSUFBSSxNQUFNLFlBQVk7NkJBQ1YsS0FBSzs7OztvQkFDYixNQUFNLE9BQU8sRUFBRyxNQUFNLGVBQWlCOzs7OztRQUkzQyxNQUFNLE1BQU0sWUFBWSxNQUFNLEtBQUssU0FBUztnQkFDNUMsUUFBTyxJQUFNO2dCQUNiLE1BQU0sS0FBTzs7OztRQUliLElBQUksTUFBTSxZQUFZO1FBQ3RCLFFBQVEsRUFBRSxLQUFLLEtBQUs7UUFDcEIsUUFBUSxFQUFFLEtBQUssT0FBTztnQkFFdEIsVUFBUyxNQUFRO2dCQUNqQixNQUFNLE9BQU8sU0FBUyxTQUFXOzs7O1FBSWpDLElBQUksTUFBTSxZQUFZO1FBQ3RCLElBQUksTUFBTSxZQUFZO2dCQUV0QixFQUFFLEtBQUssS0FBSyxVQUFZLEVBQUUsS0FBSyxLQUFLIn0=
//# sourceURL=file://kode/test/style.kode
