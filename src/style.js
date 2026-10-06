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

const ROLES = {
    row: {
        id: (c) => c.gray,
        start: (c) => c.gray,
        duration: (c) => c.yellow,
        turns: (c) => c.cyan,
        name: (c) => c.bold,
    },
    turn: {
        user: (c) => (text) => c.bgBlue(c.bold(text)),
        agent: (c) => (text) => c.bgCyan(c.bold(text)),
        mode: (c) => (text) => c.bgGray(c.black(text)),
        continue: (c) => c.gray,
    },
    tool: {
        call: (c) => (text) => c.bgMagenta(c.bold(text)),
        result: (c) => (text) => c.bgMagenta(c.bold(text)),
        exit: (c) => (text) => c.bgRed(c.bold(text)),
        note: (c) => c.gray,
    },
    del: {
        warning: (c) => (text) => c.bgRed(c.bold(c.yellow(text))),
        question: (c) => c.bold,
    },
}

function makePalette(enabled)
{
    const palette = { ...PLAIN }

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
    const style = { enabled: Boolean(enabled) }

    for (const [group, entries] of Object.entries(ROLES))
    {
        style[group] = Object.fromEntries(
            Object.entries(entries).map(([name, pick]) => [name, pick(palette)]),
        )
    }

    return style
}
