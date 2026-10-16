var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var COLUMN_WIDTH, crop, dayKey, DURATION_WIDTH, durationMinutes, FIXED_WIDTH, ID_WIDTH, LAST_WIDTH, lastOf, markerAgent, MINUTE, padded, paddedRight, PADDING, parts, renderBlock, renderBlocks, renderCall, renderResult, renderSession, renderTurn, TURNS_WIDTH

import style from "./style.js"

import escape from "./escape.js"

ID_WIDTH = 6
LAST_WIDTH = 11
DURATION_WIDTH = 6
TURNS_WIDTH = 4
PADDING = 1
COLUMN_WIDTH = ID_WIDTH + LAST_WIDTH + DURATION_WIDTH + TURNS_WIDTH
FIXED_WIDTH = COLUMN_WIDTH + (2 * PADDING) * 4
MINUTE = 60000

durationMinutes = function (ms)
{
    return String(Math.floor(Math.max(0,ms) / MINUTE))
}

crop = function (text, width)
{
    if (width <= 0)
    {
        return ''
    }
    if (text.length <= width)
    {
        return text
    }
    if (width === 1)
    {
        return '…'
    }
    return text.slice(0,width - 1) + '…'
}

parts = function (ms)
{
    var d, pad

    d = new Date(ms)
    pad = function (n)
    {
        return String(n).padStart(2,'0')
    }
    return {date:`${pad(d.getDate())}.${pad(d.getMonth() + 1)}`,time:`${pad(d.getHours())}:${pad(d.getMinutes())}`}
}

dayKey = function (ms)
{
    return parts(ms).date
}

padded = function (text, width)
{
    var fill

    fill = Math.max(0,width - text.length)
    return ' '.repeat(PADDING) + text + ' '.repeat(fill + PADDING)
}

paddedRight = function (text, width)
{
    var fill

    fill = Math.max(0,width - text.length)
    return ' '.repeat(PADDING + fill) + text + ' '.repeat(PADDING)
}

markerAgent = function (sty, agent)
{
    if (agent)
    {
        return sty.turn.agent('> agent ') + sty.turn.mode(agent)
    }
    return sty.turn.agent('> agent')
}

renderCall = function (block, sty, inAgentRun)
{
    var marker

    marker = sty.tool.call(`$ ${block.name}`)
    if (inAgentRun)
    {
        return [marker,escape(block.command),true]
    }
    return [`${markerAgent(sty,block.agent)}\n${marker}`,escape(block.command),true]
}

renderResult = function (block, sty, inAgentRun)
{
    var note, tail, text

    text = escape(block.text).trimEnd()
    if (text === '')
    {
        return [null,null,inAgentRun]
    }
    note = sty.tool.note(`… full output at ${escape(block.outputPath)}`)
    tail = block.outputPath ? `${text}\n${note}` : text
    return [sty.tool.result(`$ ${block.name} result`),tail,inAgentRun]
}

renderTurn = function (block, sty, inAgentRun)
{
    var text, _87_29_

    text = escape(((_87_29_=block.text) != null ? _87_29_ : '')).trimEnd()
    if (text === '')
    {
        return [null,null,inAgentRun]
    }
    if (block.role === 'user')
    {
        return [sty.turn.user('> user'),text,false]
    }
    if (inAgentRun)
    {
        return [sty.turn.continue('…'),text,true]
    }
    return [markerAgent(sty,block.agent),text,true]
}

renderBlock = function (block, sty, inAgentRun)
{
    if (block.kind === 'call')
    {
        return renderCall(block,sty,inAgentRun)
    }
    if (block.kind === 'exit')
    {
        return [sty.tool.exit(`$ ${block.name} exit ${block.code}`),'',inAgentRun]
    }
    if (block.kind === 'result')
    {
        return renderResult(block,sty,inAgentRun)
    }
    return renderTurn(block,sty,inAgentRun)
}

renderBlocks = function (blocks, sty)
{
    var after, block, inAgentRun, lines, marker, s, text

    s = (sty != null ? sty : style.createStyle(false))
    lines = []
    inAgentRun = false
    var list = _k_.list(blocks)
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        block = list[_a_]
        var _b_ = renderBlock(block,s,inAgentRun); marker = _b_[0]; text = _b_[1]; after = _b_[2]

        inAgentRun = after
        if (marker === null)
        {
            continue
        }
        lines.push(marker)
        if (text !== '')
        {
            lines.push(text)
        }
    }
    return lines.join('\n')
}

lastOf = function (session)
{
    var _126_40_

    return ((_126_40_=session.time_last) != null ? _126_40_ : session.time_updated)
}

renderSession = function (session, width, sty, opt = {})
{
    var cells, duration, id, name, nameWidth, repeatDate, s, shown, stamp, _132_32_, _136_37_, _150_53_

    s = (sty != null ? sty : style.createStyle(false))
    repeatDate = ((_132_32_=opt.repeatDate) != null ? _132_32_ : false)
    nameWidth = Math.max(0,((width != null ? width : 80)) - FIXED_WIDTH - (2 * PADDING))
    name = crop(escape(((_136_37_=session.title) != null ? _136_37_ : 'NULL')),nameWidth)
    duration = durationMinutes(lastOf(session) - session.time_created)
    stamp = parts(lastOf(session))
    shown = repeatDate ? `      ${stamp.time}` : `${stamp.date} ${stamp.time}`
    id = session.id.replace(/^ses_/,'').slice(0,ID_WIDTH)
    cells = [s.row.id(padded(id,ID_WIDTH)),s.row.last(padded(shown,LAST_WIDTH)),s.row.duration(paddedRight(duration,DURATION_WIDTH)),s.row.turns(paddedRight(String(((_150_53_=session.turns) != null ? _150_53_ : 0)),TURNS_WIDTH)),s.row.name(padded(name,nameWidth))]
    return cells.join('')
}
export default {
    FIXED_WIDTH:FIXED_WIDTH,
    durationMinutes:durationMinutes,
    dayKey:dayKey,
    renderBlocks:renderBlocks,
    renderSession:renderSession
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlcyI6WyIuLi9rb2RlL3JlbmRlci5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQWlCQSxXQUFXO0FBQ1gsYUFBYTtBQUNiLGlCQUFpQjtBQUNqQixjQUFjO0FBQ2QsVUFBVTtBQUVWLGVBQWUsV0FBVyxhQUFhLGlCQUFpQjtBQUV4RCxjQUFjLGdCQUFnQixJQUFJLFdBQVc7QUFFN0MsU0FBUzs7QUFFVDs7V0FBMEIsT0FBTyxLQUFLLE1BQU0sS0FBSyxJQUFJLEVBQUcsTUFBTTs7O0FBRTlEOztRQUVPLFNBQVM7O2VBQVM7O1FBQ2xCLEtBQUssVUFBVTs7ZUFBYTs7UUFDNUIsVUFBUzs7ZUFBUzs7V0FDckIsS0FBSyxNQUFNLEVBQUcsUUFBUSxLQUFLOzs7QUFFL0I7Ozs7SUFFSSxRQUFRLEtBQUs7SUFDYjs7ZUFBYSxPQUFPLEdBQUcsU0FBUyxFQUFHOztZQUVuQyxRQUFTLElBQUksRUFBRSxjQUFjLElBQUksRUFBRSxhQUFhLEtBQ2hELFFBQVMsSUFBSSxFQUFFLGVBQWUsSUFBSSxFQUFFOzs7QUFFeEM7O1dBQWlCLE1BQU0sSUFBSTs7O0FBRTNCOzs7O0lBRUksT0FBTyxLQUFLLElBQUksRUFBRyxRQUFRLEtBQUs7V0FDaEMsSUFBSSxPQUFPLFdBQVcsT0FBTyxJQUFJLE9BQU8sT0FBTzs7O0FBRW5EOzs7O0lBRUksT0FBTyxLQUFLLElBQUksRUFBRyxRQUFRLEtBQUs7V0FDaEMsSUFBSSxPQUFPLFVBQVUsUUFBUSxPQUFPLElBQUksT0FBTzs7O0FBRW5EOztRQUVPOztlQUFhLElBQUksS0FBSyxNQUFNLGNBQWMsSUFBSSxLQUFLLEtBQUs7O1dBQzNELElBQUksS0FBSyxNQUFNOzs7QUFFbkI7Ozs7SUFFSSxTQUFTLElBQUksS0FBSyxVQUFVLE1BQU07UUFFL0I7O2dCQUFtQixPQUFRLE9BQU8sTUFBTSxTQUFVOztlQUMvQyxZQUFZLElBQUssTUFBTSxXQUFXLFNBQVUsT0FBTyxNQUFNLFNBQVU7OztBQUU3RTs7OztJQUVJLE9BQU8sT0FBTyxNQUFNLE1BQU07UUFDdkIsU0FBUTs7Z0JBQVcsS0FBTSxLQUFNOztJQU1sQyxPQUFPLElBQUksS0FBSyx5QkFBeUIsT0FBTyxNQUFNO0lBQ3RELE9BQVUsTUFBTSxnQkFBbUIsU0FBUyxTQUFZO1lBRXJELElBQUksS0FBSyxZQUFZLE1BQU0sZUFBZ0IsS0FBTTs7O0FBRXhEOzs7O0lBRUksT0FBTyxpQkFBTyxNQUFNLDBCQUFPLEtBQUk7UUFDNUIsU0FBUTs7Z0JBQVcsS0FBTSxLQUFNOztRQUUvQixNQUFNLFNBQVE7O2dCQUFlLElBQUksS0FBSyxLQUFLLFVBQVcsS0FBTTs7UUFFNUQ7O2dCQUFtQixJQUFJLEtBQUssU0FBUyxLQUFNLEtBQU07O1lBQ2pELFlBQVksSUFBSyxNQUFNLE9BQVEsS0FBTTs7O0FBRTVDOztRQUVPLE1BQU0sU0FBUTs7ZUFBYyxXQUFXLE1BQU8sSUFBSzs7UUFFbkQsTUFBTSxTQUFROztnQkFDVixJQUFJLEtBQUssVUFBVSxNQUFNLGFBQWEsTUFBTSxRQUFTLEdBQUk7O1FBRTdELE1BQU0sU0FBUTs7ZUFBZ0IsYUFBYSxNQUFPLElBQUs7O1dBRTFELFdBQVcsTUFBTyxJQUFLOzs7QUFFM0I7Ozs7SUFFSSxLQUFJLGNBQUEsTUFBTSxNQUFNLFlBQVk7SUFDNUI7SUFDQSxhQUFhO3dCQUVBOzs7O2tCQUllLFlBQVksTUFBTyxFQUFHOztRQUM5QyxhQUFhO1lBRVYsV0FBVTs7WUFBVTs7UUFFdkIsTUFBTSxLQUFLO1lBQ1IsU0FBUTs7WUFBUSxNQUFNLEtBQUs7OztXQUVsQyxNQUFNLEtBQUs7OztBQUVmOzs7O3NCQUFzQixRQUFRLGdDQUFZLFFBQVE7OztBQUVsRDs7OztJQUVJLEtBQUksY0FBQSxNQUFNLE1BQU0sWUFBWTtJQUU1Qix3QkFBYSxJQUFJLGlDQUFhO0lBRTlCLFlBQVksS0FBSyxJQUFJLElBQUksZ0JBQUEsUUFBUSxPQUFNLGVBQWUsSUFBSTtJQUUxRCxPQUFPLEtBQUssa0JBQU8sUUFBUSw0QkFBUSxTQUFTO0lBRTVDLFdBQVcsZ0JBQWdCLE9BQU8sV0FBVyxRQUFRO0lBRXJELFFBQVEsTUFBTSxPQUFPO0lBRXJCLFFBQVcsc0JBQXlCLE1BQU0sWUFBZSxNQUFNLFFBQVEsTUFBTTtJQUU3RSxLQUFLLFFBQVEsR0FBRyxRQUFRLFFBQVMsSUFBSSxNQUFNLEVBQUc7SUFFOUMsU0FDSSxFQUFFLElBQUksR0FBRyxPQUFPLEdBQUksV0FDcEIsRUFBRSxJQUFJLEtBQUssT0FBTyxNQUFPLGFBQ3pCLEVBQUUsSUFBSSxTQUFTLFlBQVksU0FBVSxpQkFDckMsRUFBRSxJQUFJLE1BQU0sWUFBWSxrQkFBTyxRQUFRLDRCQUFRLElBQUksY0FDbkQsRUFBRSxJQUFJLEtBQUssT0FBTyxLQUFNO1dBRzVCLE1BQU0sS0FBSzs7O0lBR1gsWUFBYTtJQUNiLGdCQUFpQjtJQUNqQixPQUFRO0lBQ1IsYUFBYztJQUNkLGNBQWUifQ==
//# sourceURL=file://kode/render.kode
