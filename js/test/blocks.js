var toExport = {}
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var block, bs, colored, history, line, lines, marker, markerLines, markers, markersOf, name, out, plain, strip, want

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
toExport["renderBlocks"] = async function ()
{
    await section("a tool block does not close the agent run", async function ()
    {
        want = ['> user','hi conny','> agent build','let me look','$ shell','ls -la; hyprctl version','$ shell result','total 48','…','found it'].join('\n')
        compare((render.renderBlocks(history,plain)),want)
    })
    await section("a tool marker starts with a dollar, a turn marker with an angle bracket", async function ()
    {
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
            compare((marker.startsWith('>')),true)
        }
        compare((lines.includes('> user')),true)
        compare((lines.includes('> agent build')),true)
    })
    await section("there is never an agent marker and an ellipsis on one turn", async function ()
    {
        compare((markersOf(history)),['> user','> agent build','$ shell','$ shell result','…'])
    })
    await section("a user turn reopens the marker for the next agent turn", async function ()
    {
        bs = [block('turn',{role:'agent',agent:'plan',text:'one'}),block('call',{name:'shell',agent:'plan',command:'true'}),block('result',{name:'shell',text:'ok',outputPath:null}),block('turn',{role:'user',agent:null,text:'thanks'}),block('turn',{role:'agent',agent:'plan',text:'two'})]
        want = ['> agent plan','$ shell','$ shell result','> user','> agent plan']
        compare((markersOf(bs)),want)
    })
    await section("a second agent turn continues with an ellipsis", async function ()
    {
        bs = [block('turn',{role:'agent',agent:'build',text:'checking'}),block('turn',{role:'agent',agent:'build',text:'found it'}),block('turn',{role:'agent',agent:'build',text:'so that is why'})]
        compare((render.renderBlocks(bs,plain)),'> agent build\nchecking\n…\nfound it\n…\nso that is why')
    })
    await section("the continuation marker is one character, no padding", async function ()
    {
        bs = [block('turn',{role:'agent',agent:'build',text:'one'}),block('turn',{role:'agent',agent:'build',text:'two'})]
        out = render.renderBlocks(bs,plain)
        compare((out.split('\n')[2]),'…')
    })
    await section("an empty agent turn neither renders nor breaks the run", async function ()
    {
        bs = [block('turn',{role:'agent',agent:'build',text:'one'}),block('turn',{role:'agent',agent:'build',text:''}),block('turn',{role:'agent',agent:'build',text:'two'})]
        out = render.renderBlocks(bs,plain)
        compare(out,'> agent build\none\n…\ntwo')
    })
    await section("empty text renders nothing", async function ()
    {
        compare((render.renderBlocks([block('turn',{role:'user',text:'   '})],plain)),'')
        compare((render.renderBlocks([],plain)),'')
    })
    await section("an agent turn without an agent field still gets a marker", async function ()
    {
        compare((render.renderBlocks([block('turn',{role:'agent',agent:null,text:'hi'})],plain)),'> agent\nhi')
    })
}
toExport["renderBlocks"]._section_ = true
toExport["renderBlocks tools"] = async function ()
{
    await section("a run opening with a tool call gets the agent marker first", async function ()
    {
        want = ['> user','do the thing','> agent build','$ bash','false','$ bash result','boom','$ bash exit 42','…','it failed'].join('\n')
        bs = [block('turn',{role:'user',agent:null,text:'do the thing'}),block('call',{name:'bash',agent:'build',command:'false'}),block('result',{name:'bash',text:'boom',outputPath:null}),block('exit',{name:'bash',code:42}),block('turn',{role:'agent',agent:'build',text:'it failed'})]
        compare((render.renderBlocks(bs,plain)),want)
    })
    await section("only one agent marker in a run that opens with tool calls", async function ()
    {
        bs = [block('turn',{role:'user',agent:null,text:'go'}),block('call',{name:'bash',agent:'build',command:'one'}),block('result',{name:'bash',text:'1',outputPath:null}),block('call',{name:'bash',agent:'build',command:'two'}),block('result',{name:'bash',text:'2',outputPath:null}),block('turn',{role:'agent',agent:'build',text:'done'})]
        want = ['> user','> agent build','$ bash','$ bash result','$ bash','$ bash result','…']
        compare((markersOf(bs)),want)
    })
    await section("a run opening with a tool call and no agent field", async function ()
    {
        compare((render.renderBlocks([block('call',{name:'grep',agent:null,command:'x'})],plain)),'> agent\n$ grep\nx')
    })
    await section("a result marker names the tool it came from", async function ()
    {
        bs = [block('call',{name:'edit',agent:'build',command:'old'}),block('result',{name:'edit',text:'written',outputPath:null})]
        compare((render.renderBlocks(bs,plain)),'> agent build\n$ edit\nold\n$ edit result\nwritten')
    })
    await section("an exit marker names the tool and the code", async function ()
    {
        bs = [block('call',{name:'edit',agent:'build',command:'old'}),block('exit',{name:'edit',code:1})]
        compare((render.renderBlocks(bs,plain)),'> agent build\n$ edit\nold\n$ edit exit 1')
    })
    await section("a zero exit gets no exit marker", async function ()
    {
        bs = [block('call',{name:'bash',agent:'build',command:'true'}),block('result',{name:'bash',text:'',outputPath:null})]
        compare((render.renderBlocks(bs,plain)),'> agent build\n$ bash\ntrue')
    })
    await section("call and result text is verbatim and unindented", async function ()
    {
        bs = [block('call',{name:'shell',agent:'build',command:'line one\n  indented\n\nline four'}),block('result',{name:'shell',text:'  leading space\ntrailing   ',outputPath:null})]
        want = '> agent build\n$ shell\nline one\n  indented\n\nline four\n$ shell result\n  leading space\ntrailing'
        compare((render.renderBlocks(bs,plain)),want)
    })
    await section("a truncated result points at the full output", async function ()
    {
        bs = [block('result',{name:'read',text:'partial',outputPath:'/tmp/tool_abc'})]
        compare((render.renderBlocks(bs,plain)),'$ read result\npartial\n… full output at /tmp/tool_abc')
    })
    await section("a call with no following result still renders the call", async function ()
    {
        compare((render.renderBlocks([block('call',{name:'grep',agent:'build',command:'grep x'})],plain)),'> agent build\n$ grep\ngrep x')
    })
    await section("the call marker shows the tool name", async function ()
    {
        out = render.renderBlocks([block('call',{name:'webfetch',agent:'build',command:'GET /x'})],plain)
        compare((out.includes('$ webfetch\n')),true)
    })
}
toExport["renderBlocks tools"]._section_ = true
toExport["renderBlocks colors"] = async function ()
{
    await section("colors leave the visible text untouched", async function ()
    {
        compare((render.renderBlocks(history,colored).replace(/\x1b\[[0-9;]*m/g,'')),(render.renderBlocks(history,plain)))
    })
    await section("every marker is styled when color is on", async function ()
    {
        markers = markerLines()
        var list1 = _k_.list(Object.entries(markers))
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            name = list1[_b_][0]
            line = list1[_b_][1]
            compare(line !== undefined,true)
            compare((line.includes("\u001b[")),true)
        }
    })
    await section("the markers do not all collapse into one style", async function ()
    {
        lines = Object.values(markerLines())
        compare((new Set(lines)).size > 1,true)
    })
}
toExport["renderBlocks colors"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxvY2tzLmpzIiwic291cmNlcyI6WyIuLi8uLi9rb2RlL3Rlc3QvYmxvY2tzLmtvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQVdBLFFBQVEsTUFBTSxZQUFZO0FBQzFCLFVBQVUsTUFBTSxZQUFZOztBQUk1Qjs7V0FBeUIsT0FBTyxRQUFRLEtBQUEsTUFBTzs7O0FBRS9DOztXQUFrQixLQUFLLFFBQVEsa0JBQW1COztBQUVsRCxXQUNJLE1BQU0sUUFBUyxLQUFNLE9BQVEsTUFBTyxLQUFNLEtBQU0sYUFDaEQsTUFBTSxRQUFTLEtBQU0sUUFBUyxNQUFPLFFBQVMsS0FBTSxnQkFDcEQsTUFBTSxRQUFTLEtBQU0sUUFBUyxNQUFPLFFBQVMsUUFBUyw0QkFDdkQsTUFBTSxVQUFXLEtBQU0sUUFBUyxLQUFNLFdBQVksV0FBWSxPQUM5RCxNQUFNLFFBQVMsS0FBTSxRQUFTLE1BQU8sUUFBUyxLQUFNOztBQUd4RDs7OztJQUVJLE1BQU0sT0FBTyxhQUFhLE9BQVE7V0FFbEMsSUFBSSxNQUFNLE1BQU07O2VBQWMsRUFBRSxXQUFXLFFBQVEsTUFBSyxPQUFPLEVBQUUsV0FBVzs7OztBQUVoRjs7OztJQUVJLFFBQVEsT0FBTyxhQUFhLFFBQVMsU0FBUyxNQUFNO0lBQ3BEOztlQUFpQixNQUFNOzttQkFBWSxNQUFNLE9BQU07OztZQUUvQyxLQUFNLEtBQUssVUFDWCxNQUFPLEtBQUssaUJBQ1osS0FBTSxLQUFLLFdBQ1gsT0FBUSxLQUFLLGtCQUNiLFVBQVcsS0FBSzs7Ozs7O1FBTVosUUFDSSxTQUNBLFdBQ0EsZ0JBQ0EsY0FDQSxVQUNBLDBCQUNBLGlCQUNBLFdBQ0EsSUFDQSxZQUNGLEtBQUs7aUJBRU4sT0FBTyxhQUFhLFFBQVMsUUFBVTs7OztRQUl4QyxRQUFRLE9BQU8sYUFBYSxRQUFTLE9BQU8sTUFBTTs0QkFFdEMsTUFBTTs7b0JBQWUsU0FBUyxLQUFLOzs7OztZQUMzQyxTQUFTLEtBQUssTUFBTSxLQUFLO2dCQUN0QixXQUFVOztnQkFBUzs7cUJBQ3JCLE9B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
//# sourceURL=file:///home/kodi/s/occ/kode/test/blocks.kode
