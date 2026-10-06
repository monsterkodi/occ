import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { humanDuration, renderSession, createColor } from "../src/render.js"

const plain = createColor(false)

const session = {
  id: "ses_aaaaaaaaaaaa",
  title: "First session",
  time_created: 1791283494422,
  time_updated: 1791283494422 + 60_000,
  turns: 2,
}

const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, "")
const colored = createColor(true)

describe("humanDuration", () => {
  test("ends in a single unit letter, max 4 chars", () => {
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
    for (const [ms, expected] of cases) {
      const out = humanDuration(ms)
      assert.equal(out, expected, `${ms}ms`)
      assert.match(out, /^[\d]+[smhdy]$/)
      assert.ok(out.length <= 4, `${out} is longer than 4 chars`)
    }
  })
})

describe("renderSession", () => {
  test("id has the ses_ prefix stripped and is cropped to 6", () => {
    const row = strip(renderSession(session, 80, plain))
    assert.ok(row.startsWith("aaaaaa "))
  })

  test("start is month-day hour:minute, 11 chars", () => {
    const row = strip(renderSession(session, 80, plain))
    assert.match(row, /^\S{6} +\d\d-\d\d \d\d:\d\d/)
  })

  test("null title prints NULL", () => {
    const row = strip(renderSession({ ...session, title: null }, 80, plain))
    assert.ok(row.endsWith("NULL"))
  })

  test("name is cropped with an ellipsis at the terminal edge", () => {
    const row = strip(
      renderSession({ ...session, title: "x".repeat(200) }, 50, plain),
    )
    assert.equal(row.length, 50)
    assert.ok(row.endsWith("…"))
  })

  test("row never exceeds the terminal width", () => {
    for (const width of [36, 40, 60, 120]) {
      const row = strip(renderSession({ ...session, title: "y".repeat(200) }, width, plain))
      assert.ok(row.length <= width, `width ${width} produced ${row.length}`)
    }
  })

  test("fixed columns keep their widths at any terminal size", () => {
    const narrow = strip(renderSession({ ...session, title: "z" }, 40, plain))
    const wide = strip(renderSession({ ...session, title: "z" }, 120, plain))
    const fixed = (row) => row.slice(0, 33).replace(/\s+$/, "")
    assert.equal(fixed(narrow), fixed(wide))
  })

  test("colors do not shift or truncate the visible text", () => {
    assert.equal(
      strip(renderSession(session, 80, colored)),
      strip(renderSession(session, 80, plain)),
    )
    for (const width of [40, 80, 120]) {
      const row = renderSession(session, width, colored)
      assert.equal(
        strip(row).length,
        strip(renderSession(session, width, plain)).length,
      )
      assert.ok(strip(row).length <= width)
    }
  })

  test("colored name is still cropped to the terminal edge", () => {
    const row = renderSession({ ...session, title: "q".repeat(200) }, 50, colored)
    assert.equal(strip(row).length, 50)
    assert.ok(strip(row).endsWith("…"))
  })
})
