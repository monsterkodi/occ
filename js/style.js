var _k_ = {isStr: function (o) {return typeof o === 'string' || o instanceof String}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var code, CODES, createStyle, delQuestion, delWarning, makeHexStyle, makePalette, parseHex, PLAIN, ROLES, rowDuration, rowId, rowLast, rowName, rowTurns, toolCall, toolExit, toolNote, toolResult, TRUE_COLOR, turnAgent, turnContinue, turnMode, turnUser

class StyleError extends Error
{
    constructor (message)
    {
        super(message)
    
        this.name = 'StyleError'
    }
}

CODES = {reset:[0,0],bold:[1,22],dim:[2,22],italic:[3,23],underline:[4,24],black:[30,39],red:[31,39],green:[32,39],yellow:[33,39],blue:[34,39],magenta:[35,39],cyan:[36,39],white:[37,39],gray:[90,39],bgBlack:[40,49],bgRed:[41,49],bgGreen:[42,49],bgYellow:[43,49],bgBlue:[44,49],bgMagenta:[45,49],bgCyan:[46,49],bgWhite:[47,49],bgGray:[100,49]}

PLAIN = function (text)
{
    return String(text)
}
TRUE_COLOR = {foreground:[38,39],background:[48,49]}

rowId = function (c)
{
    return function (text)
    {
        return c.bg('#111',c.fg('#ff0',text))
    }
}

rowLast = function (c)
{
    return function (text)
    {
        return c.bg('#111',c.fg('#55a',text))
    }
}

rowDuration = function (c)
{
    return function (text)
    {
        return c.bg('#111',c.fg('#88f',text))
    }
}

rowTurns = function (c)
{
    return function (text)
    {
        return c.bg('#111',c.red(text))
    }
}

rowName = function (c)
{
    return function (text)
    {
        return c.bg('#181818',c.bold(text))
    }
}

turnUser = function (c)
{
    return function (text)
    {
        return c.bg('#181818',c.fg('#ff0',c.bold(text)))
    }
}

turnAgent = function (c)
{
    return function (text)
    {
        return c.bg('#181818',c.fg('#f22',c.bold(text)))
    }
}

turnMode = function (c)
{
    return function (text)
    {
        return c.bg('#101010',c.fg('#88f',text))
    }
}

turnContinue = function (c)
{
    return c.gray
}

toolCall = function (c)
{
    return function (text)
    {
        return c.bg('#181818',c.fg('#88f',c.bold(text)))
    }
}

toolResult = function (c)
{
    return function (text)
    {
        return c.bg('#101010',c.fg('#aaa',c.bold(text)))
    }
}

toolExit = function (c)
{
    return function (text)
    {
        return c.bg('#ff1818',c.fg('#ff0',c.bold(text)))
    }
}

toolNote = function (c)
{
    return c.gray
}

delWarning = function (c)
{
    return function (text)
    {
        return c.bg('#f00',c.bold(c.fg('#ff0',text)))
    }
}

delQuestion = function (c)
{
    return function (text)
    {
        return c.bg('#a00',c.bold(c.fg('#ff0',text)))
    }
}
ROLES = {row:{id:rowId,last:rowLast,duration:rowDuration,turns:rowTurns,name:rowName},turn:{user:turnUser,agent:turnAgent,mode:turnMode,continue:turnContinue},tool:{call:toolCall,result:toolResult,exit:toolExit,note:toolNote},del:{warning:delWarning,question:delQuestion}}

parseHex = function (hex)
{
    var digits, value

    if (!(_k_.isStr(hex)))
    {
        throw new StyleError(`color must be a string, got ${typeof(hex)}`)
    }
    digits = (/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i).exec(hex.trim())
    if (digits === null)
    {
        throw new StyleError(`invalid color \"${hex}\", expected #rgb or #rrggbb with hex digits`)
    }
    value = digits[1].length === 3 ? Array.from(digits[1]).map(function (d)
    {
        return d + d
    }).join('') : digits[1]
    return [Number.parseInt(value.slice(0,2),16),Number.parseInt(value.slice(2,4),16),Number.parseInt(value.slice(4,6),16)]
}

makeHexStyle = function (enabled, layer)
{
    var close, open

    var _a_ = TRUE_COLOR[layer]; open = _a_[0]; close = _a_[1]

    if (!enabled)
    {
        return function (hex, text)
        {
            return PLAIN(text)
        }
    }
    return function (hex, text)
    {
        var b, g, r

        var _b_ = parseHex(hex); r = _b_[0]; g = _b_[1]; b = _b_[2]

        return `\u001b[${open};2;${r};${g};${b}m${text}\u001b[${close}m`
    }
}

code = function (open, close)
{
    return function (text)
    {
        return `\u001b[${open}m${text}\u001b[${close}m`
    }
}

makePalette = function (enabled)
{
    var entry, key, pair, palette

    palette = Object.assign({},PLAIN,{fg:makeHexStyle(enabled,'foreground'),bg:makeHexStyle(enabled,'background')})
    if (!enabled)
    {
        var list = _k_.list(Object.keys(CODES))
        for (var _c_ = 0; _c_ < list.length; _c_++)
        {
            key = list[_c_]
            palette[key] = PLAIN
        }
        return palette
    }
    var list1 = _k_.list(Object.entries(CODES))
    for (var _d_ = 0; _d_ < list1.length; _d_++)
    {
        entry = list1[_d_]
        key = entry[0]
        pair = entry[1]
        palette[key] = code(pair[0],pair[1])
    }
    return palette
}

createStyle = function (enabled)
{
    var entries, entry, group, on, palette, picks, style

    on = Boolean(enabled)
    palette = makePalette(on)
    style = {enabled:on,palette:palette,fg:palette.fg,bg:palette.bg}
    var list = _k_.list(Object.entries(ROLES))
    for (var _e_ = 0; _e_ < list.length; _e_++)
    {
        entry = list[_e_]
        group = entry[0]
        entries = entry[1]
        picks = Object.entries(entries).map(function ([name,pick])
        {
            return [name,pick(palette)]
        })
        style[group] = Object.fromEntries(picks)
    }
    return style
}
export default {
    createStyle:createStyle,
    StyleError:StyleError
}