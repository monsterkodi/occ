var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, isFunc: function (o) {return typeof o === 'function'}}

var groups, HEX, roleOf, strip, walk

import test from 'node:test'
import assert from 'node:assert/strict'
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
test.describe('createStyle',function ()
{
    test('exposes the same roles whether or not color is on',function ()
    {
        return assert.deepEqual(walk(style.createStyle(true)),walk(style.createStyle(false)))
    })
    test('every role is a function of text',function ()
    {
        var fn, role

        var list = _k_.list(walk(style.createStyle(true)))
        for (var _c_ = 0; _c_ < list.length; _c_++)
        {
            role = list[_c_]
            fn = roleOf(style.createStyle(true),role)
            assert.equal(typeof(fn),'function',`${role} is not a function`)
            assert.equal(typeof(fn('x')),'string')
        }
    })
    test('reports whether color is enabled',function ()
    {
        assert.equal(style.createStyle(true).enabled,true)
        return assert.equal(style.createStyle(false).enabled,false)
    })
    test('each expected role exists',function ()
    {
        var group, s

        s = style.createStyle(true)
        var list = _k_.list(groups)
        for (var _d_ = 0; _d_ < list.length; _d_++)
        {
            group = list[_d_]
            assert.ok(s[group],`missing group ${group}`)
        }
        assert.deepEqual(Object.keys(s.row),['id','last','duration','turns','name'])
        assert.deepEqual(Object.keys(s.turn),['user','agent','mode','continue'])
        assert.deepEqual(Object.keys(s.tool),['call','result','exit','note'])
        return assert.deepEqual(Object.keys(s.del),['warning','question'])
    })
    test('disabled style returns the text unchanged',function ()
    {
        var role, s

        s = style.createStyle(false)
        var list = _k_.list(walk(s))
        for (var _e_ = 0; _e_ < list.length; _e_++)
        {
            role = list[_e_]
            assert.equal(roleOf(s,role)('plain text'),'plain text',role)
        }
    })
    test('enabled style returns the same visible text',function ()
    {
        var role, s

        s = style.createStyle(true)
        var list = _k_.list(walk(s))
        for (var _f_ = 0; _f_ < list.length; _f_++)
        {
            role = list[_f_]
            assert.equal(strip(roleOf(s,role)('plain text')),'plain text',role)
        }
    })
    test('a dim role wraps text without changing it',function ()
    {
        var out

        out = style.createStyle(true).turn.continue('…')
        assert.notEqual(out,'…')
        return assert.equal(strip(out),'…')
    })
    test('nested styles compose rather than replace',function ()
    {
        var inner, outer, s

        s = style.createStyle(true)
        inner = s.turn.mode('build')
        outer = s.tool.result(inner)
        assert.notEqual(inner,outer)
        return assert.ok(strip(outer).includes,'build')
    })
    return test('styling is applied consistently across runs',function ()
    {
        var a, b

        a = style.createStyle(true)
        b = style.createStyle(true)
        return assert.equal(a.turn.user('> user'),b.turn.user('> user'))
    })
})