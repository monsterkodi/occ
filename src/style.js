const CODES = {
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    gray: [90, 39],
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgGray: [100, 49],
}

const PLAIN = (text) => String(text)

const TRUE_COLOR = { foreground: [38, 39], background: [48, 49] }

const ROLES = {
    row: {
        id:       (c) => (text) => c.bg("#111", c.fg("#666", text)),
        start:    (c) => (text) => c.bg("#111", c.fg("#55a", text)),
        duration: (c) => (text) => c.bg("#111", c.fg("#88f", text)),
        turns:    (c) => (text) => c.bg("#111", c.red(text)),
        name:     (c) => (text) => c.bg("#181818", c.bold(text)),
    },
    turn: {
        user:     (c) => (text) => c.bg("#181818", c.fg("#ff0", c.bold(text))),
        agent:    (c) => (text) => c.bg("#181818", c.fg("#f22", c.bold(text))),
        mode:     (c) => (text) => c.bg("#101010", c.fg("#88f", text)),
        continue: (c) => c.gray,
    },
    tool: {
        call:     (c) => (text) => c.bg("#181818", c.fg("#88f", c.bold(text))),
        result:   (c) => (text) => c.bg("#101010", c.fg("#aaa", c.bold(text))),
        exit:     (c) => (text) => c.bg("#ff1818", c.fg("#ff0", c.bold(text))),
        note:     (c) => c.gray,
    },
    del: {
        warning:  (c) => (text) => c.bg("#f00", c.bold(c.fg("#ff0", text))),
        question: (c) => (text) => c.bg("#a00", c.bold(c.fg("#ff0", text))),
    },
}

export class StyleError extends Error
{
    constructor(message)
    {
        super(message)
        this.name = "StyleError"
    }
}

function parseHex(hex)
{
    if (typeof hex !== "string")
    {
        throw new StyleError(`color must be a string, got ${typeof hex}`)
    }

    const digits = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
    if (digits === null)
    {
        throw new StyleError(
            `invalid color "${hex}", expected #rgb or #rrggbb with hex digits`,
        )
    }

    const value = digits[1].length === 3
        ? [...digits[1]].map((d) => d + d).join("")
        : digits[1]

    return [
        Number.parseInt(value.slice(0, 2), 16),
        Number.parseInt(value.slice(2, 4), 16),
        Number.parseInt(value.slice(4, 6), 16),
    ]
}

function makeHexStyle(enabled, layer)
{
    const [open, close] = TRUE_COLOR[layer]

    if (!enabled)
    {
        return (hex, text) => PLAIN(text)
    }

    return (hex, text) => {
        const [r, g, b] = parseHex(hex)
        return `\x1b[${open};2;${r};${g};${b}m${text}\x1b[${close}m`
    }
}

function makePalette(enabled)
{
    const palette = { ...PLAIN, fg: makeHexStyle(enabled, "foreground"), bg: makeHexStyle(enabled, "background") }

    if (!enabled)
    {
        for (const key of Object.keys(CODES)) palette[key] = PLAIN
        return palette
    }

    for (const [key, [open, close]] of Object.entries(CODES))
    {
        palette[key] = (text) => `\x1b[${open}m${text}\x1b[${close}m`
    }

    return palette
}

export function createStyle(enabled)
{
    const palette = makePalette(Boolean(enabled))
    const style = {
        enabled: Boolean(enabled),
        palette,
        fg: palette.fg,
        bg: palette.bg,
    }

    for (const [group, entries] of Object.entries(ROLES))
    {
        style[group] = Object.fromEntries(
            Object.entries(entries).map(([name, pick]) => [name, pick(palette)]),
        )
    }

    return style
}
