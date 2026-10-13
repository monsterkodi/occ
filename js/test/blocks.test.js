var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var block, colored, history, markerLines, markersOf, plain, strip

import test from 'node:test'
import assert from 'node:assert/strict'
import render from "../render.js"

import style from "../style.js"

plain = style.createStyle(false)
colored = style.createStyle(true)

block = function (kind, extra)
{
    return Object.assign({kind:kind},extra)
}

strip = function (text)
{
    return text.replace(/\x1b\[[0-9;]*m/g,'')
}
history = [block('turn',{role:'user',agent:null,text:'hi conny'}),block('turn',{role:'agent',agent:'build',text:'let me look'}),block('call',{name:'shell',agent:'build',command:'ls -la; hyprctl version'}),block('result',{name:'shell',text:'total 48',outputPath:null}),block('turn',{role:'agent',agent:'build',text:'found it'})]

markersOf = function (blocks)
{
    var out

    out = render.renderBlocks(blocks,plain)
    return out.split('\n').filter(function (l)
    {
        return l.startsWith('>') || l === '…' || l.startsWith('$')
    })
}

markerLines = function ()
{
    var find, lines

    lines = render.renderBlocks(history,colored).split('\n')
    find = function (text)
    {
        return lines.find(function (l)
        {
            return strip(l) === text
        })
    }
    return {user:find('> user'),agent:find('> agent build'),call:find('$ shell'),result:find('$ shell result'),continued:find('…')}
}
test.describe('renderBlocks',function ()
{
    test('a tool block does not close the agent run',function ()
    {
        var want

        want = ['> user','hi conny','> agent build','let me look','$ shell','ls -la; hyprctl version','$ shell result','total 48','…','found it'].join('\n')
        return assert.equal(render.renderBlocks(history,plain),want)
    })
    test('a tool marker starts with a dollar, a turn marker with an angle bracket',function ()
    {
        var line, lines, marker

        lines = render.renderBlocks(history,plain).split('\n')
        var list = _k_.list(lines.filter(function (l)
        {
            return (/^[>$]/).test(l)
        }))
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            line = list[_a_]
            marker = line.split(' ')[0]
            if (marker === '$')
            {
                continue
            }
            assert.ok(marker.startsWith('>'),`tool marker ${marker}`)
        }
        assert.ok(lines.includes,'> user')
        return assert.ok(lines.includes,'> agent build')
    })
    test('there is never an agent marker and an ellipsis on one turn',function ()
    {
        return assert.deepEqual(markersOf(history),['> user','> agent build','$ shell','$ shell result','…'])
    })
    test('a user turn reopens the marker for the next agent turn',function ()
    {
        var bs, want

        bs = [block('turn',{role:'agent',agent:'plan',text:'one'}),block('call',{name:'shell',agent:'plan',command:'true'}),block('result',{name:'shell',text:'ok',outputPath:null}),block('turn',{role:'user',agent:null,text:'thanks'}),block('turn',{role:'agent',agent:'plan',text:'two'})]
        want = ['> agent plan','$ shell','$ shell result','> user','> agent plan']
        return assert.deepEqual(markersOf(bs),want)
    })
    test('a second agent turn continues with an ellipsis',function ()
    {
        var bs

        bs = [block('turn',{role:'agent',agent:'build',text:'checking'}),block('turn',{role:'agent',agent:'build',text:'found it'}),block('turn',{role:'agent',agent:'build',text:'so that is why'})]
        return assert.equal(render.renderBlocks(bs,plain),'> agent build\nchecking\n…\nfound it\n…\nso that is why')
    })
    test('the continuation marker is one character, no padding',function ()
    {
        var bs, out

        bs = [block('turn',{role:'agent',agent:'build',text:'one'}),block('turn',{role:'agent',agent:'build',text:'two'})]
        out = render.renderBlocks(bs,plain)
        return assert.equal(out.split('\n')[2],'…')
    })
    test('an empty agent turn neither renders nor breaks the run',function ()
    {
        var bs, out

        bs = [block('turn',{role:'agent',agent:'build',text:'one'}),block('turn',{role:'agent',agent:'build',text:''}),block('turn',{role:'agent',agent:'build',text:'two'})]
        out = render.renderBlocks(bs,plain)
        return assert.equal(out,'> agent build\none\n…\ntwo')
    })
    test('empty text renders nothing',function ()
    {
        assert.equal(render.renderBlocks([block('turn',{role:'user',text:'   '})],plain),'')
        return assert.equal(render.renderBlocks([],plain),'')
    })
    return test('an agent turn without an agent field still gets a marker',function ()
    {
        return assert.equal(render.renderBlocks([block('turn',{role:'agent',agent:null,text:'hi'})],plain),'> agent\nhi')
    })
})
test.describe('renderBlocks tools',function ()
{
    test('a run opening with a tool call gets the agent marker first',function ()
    {
        var bs, want

        want = ['> user','do the thing','> agent build','$ bash','false','$ bash result','boom','$ bash exit 42','…','it failed'].join('\n')
        bs = [block('turn',{role:'user',agent:null,text:'do the thing'}),block('call',{name:'bash',agent:'build',command:'false'}),block('result',{name:'bash',text:'boom',outputPath:null}),block('exit',{name:'bash',code:42}),block('turn',{role:'agent',agent:'build',text:'it failed'})]
        return assert.equal(render.renderBlocks(bs,plain),want)
    })
    test('only one agent marker in a run that opens with tool calls',function ()
    {
        var bs, want

        bs = [block('turn',{role:'user',agent:null,text:'go'}),block('call',{name:'bash',agent:'build',command:'one'}),block('result',{name:'bash',text:'1',outputPath:null}),block('call',{name:'bash',agent:'build',command:'two'}),block('result',{name:'bash',text:'2',outputPath:null}),block('turn',{role:'agent',agent:'build',text:'done'})]
        want = ['> user','> agent build','$ bash','$ bash result','$ bash','$ bash result','…']
        return assert.deepEqual(markersOf(bs),want)
    })
    test('a run opening with a tool call and no agent field',function ()
    {
        return assert.equal(render.renderBlocks([block('call',{name:'grep',agent:null,command:'x'})],plain),'> agent\n$ grep\nx')
    })
    test('a result marker names the tool it came from',function ()
    {
        var bs

        bs = [block('call',{name:'edit',agent:'build',command:'old'}),block('result',{name:'edit',text:'written',outputPath:null})]
        return assert.equal(render.renderBlocks(bs,plain),'> agent build\n$ edit\nold\n$ edit result\nwritten')
    })
    test('an exit marker names the tool and the code',function ()
    {
        var bs

        bs = [block('call',{name:'edit',agent:'build',command:'old'}),block('exit',{name:'edit',code:1})]
        return assert.equal(render.renderBlocks(bs,plain),'> agent build\n$ edit\nold\n$ edit exit 1')
    })
    test('a zero exit gets no exit marker',function ()
    {
        var bs

        bs = [block('call',{name:'bash',agent:'build',command:'true'}),block('result',{name:'bash',text:'',outputPath:null})]
        return assert.equal(render.renderBlocks(bs,plain),'> agent build\n$ bash\ntrue')
    })
    test('call and result text is verbatim and unindented',function ()
    {
        var bs, want

        bs = [block('call',{name:'shell',agent:'build',command:'line one\n  indented\n\nline four'}),block('result',{name:'shell',text:'  leading space\ntrailing   ',outputPath:null})]
        want = '> agent build\n$ shell\nline one\n  indented\n\nline four\n$ shell result\n  leading space\ntrailing'
        return assert.equal(render.renderBlocks(bs,plain),want)
    })
    test('a truncated result points at the full output',function ()
    {
        var bs

        bs = [block('result',{name:'read',text:'partial',outputPath:'/tmp/tool_abc'})]
        return assert.equal(render.renderBlocks(bs,plain),'$ read result\npartial\n… full output at /tmp/tool_abc')
    })
    test('a call with no following result still renders the call',function ()
    {
        return assert.equal(render.renderBlocks([block('call',{name:'grep',agent:'build',command:'grep x'})],plain),'> agent build\n$ grep\ngrep x')
    })
    return test('the call marker shows the tool name',function ()
    {
        var out

        out = render.renderBlocks([block('call',{name:'webfetch',agent:'build',command:'GET /x'})],plain)
        return assert.ok(out.includes('$ webfetch\n'))
    })
})
test.describe('renderBlocks colors',function ()
{
    test('colors leave the visible text untouched',function ()
    {
        return assert.equal(render.renderBlocks(history,colored).replace(/\x1b\[[0-9;]*m/g,''),render.renderBlocks(history,plain))
    })
    test('every marker is styled when color is on',function ()
    {
        var line, markers, name

        markers = markerLines()
        var list = _k_.list(Object.entries(markers))
        for (var _b_ = 0; _b_ < list.length; _b_++)
        {
            name = list[_b_][0]
            line = list[_b_][1]
            assert.ok(line !== undefined,`no ${name} marker`)
            assert.ok(line.includes("\u001b["),`${name} is not styled`)
        }
    })
    return test('the markers do not all collapse into one style',function ()
    {
        var lines

        lines = Object.values(markerLines())
        return assert.ok((new Set(lines)).size > 1,'all markers render identically')
    })
})