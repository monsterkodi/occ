import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { durationMinutes, renderSession } from "../src/render.js"
import { createStyle } from "../src/style.js"

const plain = createStyle(false)
const colored = createStyle(true)

const session = {
    id: "ses_aaaaaaaaaaaa",
    title: "First session",
    time_created: 1791283494422,
    time_updated: 1791283494422 + 60_000,
    time_last: 1791283494422 + 60_000,
    turns: 2,
}

const strip = (text) => text.replace(/\x1b\[[0-9;]*m/g, "")

const row = (over = {}, width = 80, color = plain, options = undefined) =>
    renderSession({ ...session, ...over }, width, color, options)

describe("durationMinutes", () => {
    test("is whole minutes, with no unit", () =>
    {
        const cases = [
            [0, "0"],
            [999, "0"],
            [59_999, "0"],
            [60_000, "1"],
            [60_000 + 59_999, "1"],
            [90_000, "1"],
            [18 * 60_000, "18"],
            [59 * 60_000, "59"],
            [3_600_000, "60"],
            [24 * 3_600_000, "1440"],
            [365 * 86_400_000, "525600"],
        ]

        for (const [ms, expected] of cases)
        {
            const out = durationMinutes(ms)
            assert.equal(out, expected, `${ms}ms`)
            assert.match(out, /^\d+$/)
        }
    })

    test("a negative span reads as zero", () =>
    {
        assert.equal(durationMinutes(-5000), "0")
    })

    test("six digits covers just under two years", () =>
    {
        const minute = 60_000
        assert.equal(durationMinutes(999_999 * minute).length, 6)
        assert.equal(durationMinutes(1_000_000 * minute).length, 7)
    })
})

describe("renderSession", () => {
    test("id has the ses_ prefix stripped and is cropped to 6", () =>
    {
        assert.match(strip(row()), /^ aaaaaa /)
    })

    test("last is month-day hour:minute, 11 chars", () =>
    {
        assert.match(strip(row()), /^ aaaaaa +\d\d-\d\d \d\d:\d\d /)
    })

    test("last reads the time of the last turn, not the start", () =>
    {
        const out = strip(row({ time_last: 1791283494422 + 24 * 3_600_000 }))
        assert.ok(out.startsWith(" aaaaaa  10-07 12:44 "), JSON.stringify(out.slice(0, 24)))
    })

    test("a session without a last turn falls back to its update time", () =>
    {
        const out = strip(row({ time_last: undefined }))
        assert.ok(out.startsWith(" aaaaaa  10-06 12:45 "), JSON.stringify(out.slice(0, 24)))
    })

    test("null title prints NULL", () =>
    {
        assert.match(strip(row({ title: null })), / NULL/)
    })

    test("every cell is inset by one space on each side", () =>
    {
        const out = strip(row({ title: "zz" }))
        assert.ok(out.startsWith(" aaaaaa  10-06 12:45 "), JSON.stringify(out.slice(0, 24)))
        assert.ok(out.includes("zz  "), JSON.stringify(out.slice(0, 40)))
        assert.equal(out.length, 80)
    })

    test("the fixed columns are 34 wide and do not move with the terminal", () =>
    {
        const fixed = (text) => strip(row({ title: "z" }, text)).slice(0, 35)
        assert.equal(fixed(40), fixed(120))
        assert.equal(fixed(80).length, 35)
    })

    test("the duration column holds six digits of minutes", () =>
    {
        const minute = 60_000
        const out = strip(row({ time_last: 1791283494422 + 999_999 * minute }))
        assert.match(out, /\s999999\s/)
    })

    test("duration measures to the last message, not the update time", () =>
    {
        const minute = 60_000
        const out = strip(row({ time_last: 1791283494422 + 5 * minute }))
        assert.match(out, /\s5\s/), JSON.stringify(out.slice(0, 32))
    })

    test("a session without a last turn measures to its update time", () =>
    {
        const out = strip(row({ time_last: undefined }))
        assert.match(out, /\s1\s/), JSON.stringify(out.slice(0, 32))
    })

    test("the name column fills to the terminal edge", () =>
    {
        assert.equal(strip(row({ title: "zz" }, 80)).length, 80)
        assert.equal(strip(row({ title: "zz" }, 60)).length, 60)
    })

    test("a long name is cropped inside the name column", () =>
    {
        const out = strip(row({ title: "x".repeat(200) }, 50))
        assert.ok(out.includes("…"), out)
        assert.equal(out.length, 50)
    })

    test("the row fills the terminal, or falls back to its minimum width", () =>
    {
        for (const width of [38, 40, 60, 120])
        {
            const out = strip(row({ title: "y".repeat(200) }, width))
            assert.ok(out.length <= width, `width ${width} produced ${out.length}`)
        }

        assert.equal(strip(row({}, 20)).length, 37)
        assert.equal(strip(row({}, 80)).length, 80)
    })
})

describe("renderSession repeatDate", () => {
    // day of the month-day part, from a stamp the row rendered
    const dateOf = (text) => /^ (\w{6} +)(\d\d-\d\d)/.exec(strip(text))?.[2]

    const day = (month, date, hours, minutes) =>
        new Date(2026, month - 1, date, hours, minutes, 0, 0).getTime()

    test("a repeated date renders as spaces, the time stays", () =>
    {
        const out = row({ time_last: day(10, 7, 11, 0) }, 80, plain, { repeatDate: true })
        assert.match(strip(out), /^ aaaaaa + {5}\d\d:\d\d /, JSON.stringify(strip(out).slice(0, 24)))
    })

    test("the date is printed when repeatDate is not set", () =>
    {
        const out = row({ time_last: day(10, 7, 11, 0) }, 80, plain, { repeatDate: false })
        assert.equal(dateOf(out), "10-07")
    })

    test("the row keeps its width and its cell positions with a repeated date", () =>
    {
        const blanked = row({ time_last: day(10, 7, 11, 0) }, 80, plain, { repeatDate: true })
        const shown = row({ time_last: day(10, 7, 11, 0) }, 80, plain, { repeatDate: false })

        assert.equal(blanked.length, shown.length)
        assert.equal(strip(blanked).length, 80)
        assert.equal(strip(blanked).slice(21), strip(shown).slice(21))
    })

    test("colors wrap the blanked date like any other cell", () =>
    {
        const custom = createStyle(true)
        const background = (text) => `\x1b[44m${text}\x1b[49m`
        custom.row.last = background

        const out = row({ time_last: day(10, 7, 11, 0) }, 80, custom, { repeatDate: true })
        assert.ok(out.includes("\x1b[44m"), "the cell lost its background")
        assert.equal(strip(out).length, 80)
    })
})

describe("renderSession padding", () => {
    const background = (text) => `\x1b[44m${text}\x1b[49m`

    test("cell padding sits inside the role, so a background reaches the gap", () =>
    {
        const custom = createStyle(true)
        custom.row.id = background
        custom.row.last = background

        const out = row({}, 80, custom)
        assert.ok(out.startsWith("\x1b[44m aaaaaa "), JSON.stringify(out.slice(0, 20)))
    })

    test("no space between two cells is left unstyled", () =>
    {
        const custom = createStyle(true)
        for (const key of ["id", "last", "duration", "turns", "name"])
        {
            custom.row[key] = background
        }

        const out = row({}, 80, custom)
        const plain = strip(out)

        for (let i = 1; i < plain.length; i++)
        {
            if (plain[i] !== " ") continue
            assert.ok(out.includes("\x1b[44m"), `space at ${i} sits outside a background`)
        }
    })

    test("a fully backgrounded row has the same visible text as a plain one", () =>
    {
        const custom = createStyle(true)
        for (const key of ["id", "last", "duration", "turns", "name"])
        {
            custom.row[key] = background
        }

        assert.equal(strip(row({}, 80, custom)), strip(row({}, 80)))
    })
})

describe("renderSession colors", () => {
    test("colors do not shift or truncate the visible text", () =>
    {
        assert.equal(strip(row({}, 80, colored)), strip(row()))

        for (const width of [40, 80, 120])
        {
            const withColor = row({}, width, colored)
            assert.equal(strip(withColor).length, strip(row({}, width)).length)
            assert.ok(strip(withColor).length <= width)
        }
    })

    test("a colored long name still ends at the terminal edge", () =>
    {
        const out = strip(row({ title: "q".repeat(200) }, 50, colored))
        assert.equal(out.length, 50)
        assert.ok(out.includes("…"))
    })
})
