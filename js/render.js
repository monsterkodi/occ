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
    var text, _92_29_

    text = escape(((_92_29_=block.text) != null ? _92_29_ : '')).trimEnd()
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
    var _133_40_

    return ((_133_40_=session.time_last) != null ? _133_40_ : session.time_updated)
}

renderSession = function (session, width, sty, opt = {})
{
    var cells, duration, id, name, nameWidth, repeatDate, s, shown, stamp, _141_32_, _145_37_, _159_53_

    s = (sty != null ? sty : style.createStyle(false))
    repeatDate = ((_141_32_=opt.repeatDate) != null ? _141_32_ : false)
    nameWidth = Math.max(0,((width != null ? width : 80)) - FIXED_WIDTH - (2 * PADDING))
    name = crop(escape(((_145_37_=session.title) != null ? _145_37_ : 'NULL')),nameWidth)
    duration = durationMinutes(lastOf(session) - session.time_created)
    stamp = parts(lastOf(session))
    shown = repeatDate ? `      ${stamp.time}` : `${stamp.date} ${stamp.time}`
    id = session.id.replace(/^ses_/,'').slice(0,ID_WIDTH)
    cells = [s.row.id(padded(id,ID_WIDTH)),s.row.last(padded(shown,LAST_WIDTH)),s.row.duration(paddedRight(duration,DURATION_WIDTH)),s.row.turns(paddedRight(String(((_159_53_=session.turns) != null ? _159_53_ : 0)),TURNS_WIDTH)),s.row.name(padded(name,nameWidth))]
    return cells.join('')
}
export default {
    FIXED_WIDTH:FIXED_WIDTH,
    durationMinutes:durationMinutes,
    dayKey:dayKey,
    renderBlocks:renderBlocks,
    renderSession:renderSession
}