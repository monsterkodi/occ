import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { humanDuration, renderSession } from "../src/render.js"
import { createStyle } from "../src/style.js"

const plain = createStyle(false)
const colored = createStyle(true)

const session = {
    id: "ses_aaaaaaaaaaaa",
    title: "First session",
    time_created: 1791283494422,
    time_updated: 1791283494422 + 60_000,
    turns: 2,
}

const strip = (text) => text.replace(/\x1b\[[0-9;]*m/g, "")

const row = (over = {}, width = 80, color = plain) =>
    renderSession({ ...session, ...over }, width, color)

describe("humanDuration", () => {
    test("ends in a single unit letter, max 4 chars", () =>
    {
        const cases = [
            [0, "0s"],
            [999, "0s"],
            [45_000, "45s"],
            [59_999, "59s"],
            [60_000, "1m"],
            [18 * 60_000, "18m"],
            [59 * 60_000, "59m"],
            [60 * 60_000, "1h"],
            [4 * 3_600_000, "4h"],
            [24 * 3_600_000, "1d"],
            [360 * 86_400_000, "360d"],
            [365 * 86_400_000, "1y"],
            [800 * 86_400_000, "2y"],
        ]

        for (const [ms, expected] of cases)
        {
            const out = humanDuration(ms)
            assert.equal(out, expected, `${ms}ms`)
            assert.match(out, /^[\d]+[smhdy]$/)
            assert.ok(out.length <= 4, `${out} is longer than 4 chars`)
        }
    })
})

describe("renderSession", () => {
    test("id has the ses_ prefix stripped and is cropped to 6", () =>
    {
        assert.ok(strip(row()).startsWith("aaaaaa "))
    })

    test("start is month-day hour:minute, 11 chars", () =>
    {
        assert.match(strip(row()), /^\S{6} +\d\d-\d\d \d\d:\d\d/)
    })

    test("null title prints NULL", () =>
    {
        assert.ok(strip(row({ title: null })).endsWith("NULL"))
    })

    test("name is cropped with an ellipsis at the terminal edge", () =>
    {
        const out = strip(row({ title: "x".repeat(200) }, 50))
        assert.equal(out.length, 50)
        assert.ok(out.endsWith("…"))
    })

    test("row never exceeds the terminal width", () =>
    {
        for (const width of [36, 40, 60, 120])
        {
            const out = strip(row({ title: "y".repeat(200) }, width))
            assert.ok(out.length <= width, `width ${width} produced ${out.length}`)
        }
    })

    test("fixed columns keep their widths at any terminal size", () =>
    {
        const narrow = strip(row({ title: "z" }, 40))
        const wide = strip(row({ title: "z" }, 120))
        const fixed = (text) => text.slice(0, 33).replace(/\s+$/, "")
        assert.equal(fixed(narrow), fixed(wide))
    })

    test("colored name is still cropped to the terminal edge", () =>
    {
        const out = strip(row({ title: "q".repeat(200) }, 50, colored))
        assert.equal(out.length, 50)
        assert.ok(out.endsWith("…"))
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
})
