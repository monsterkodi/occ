import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { shell } from "../src/shell.js"
import { createStyle } from "../src/style.js"

const { DB_PATH } = fixtures()

const plain = createStyle(false)

const run = (ids, width = 80) =>
    shell({ db: openDb(DB_PATH), prefixes: ids, width, style: plain })

describe("shell blocks", () => {
    test("starts with the session row, then the commands", () =>
    {
        const lines = run(["cccccc"]).split("\n")
        assert.ok(lines[0].startsWith("cccccc "))
        assert.ok(lines.includes("$ shell"))
    })

    test("shows the result of every command, successful or not", () =>
    {
        const out = run(["cccccc"])
        assert.ok(out.includes("$ shell result\nhi"))
        assert.ok(out.includes("$ shell result\nboom"))
    })

    test("shows an exit marker for a nonzero exit", () =>
    {
        assert.ok(run(["cccccc"]).includes("$ shell exit 42"))
    })

    test("a successful command gets no exit marker", () =>
    {
        assert.ok(!run(["cccccc"]).includes("$ shell exit 0"))
    })

    test("shows the agent marker, since it labels whose commands these are", () =>
    {
        assert.ok(run(["cccccc"]).includes("> agent build"))
    })
})

describe("shell filtering", () => {
    test("shows no user turns and no continuation ellipses", () =>
    {
        const out = run(["cccccc"])
        assert.ok(!out.includes("> user"))
        assert.ok(!out.includes("\n…"))
        assert.ok(!out.includes("one"))
    })

    test("only shell tools are shown", () =>
    {
        const out = run(["aaaaaa"])
        assert.ok(out.includes("$ shell"))
        assert.ok(!out.includes("$ read"))
        assert.ok(!out.includes("$ webfetch"))
        assert.ok(!out.includes("$ grep"))
    })

    test("a non-shell tool is never shown even when its name is close", () =>
    {
        assert.ok(!run(["cccccc"]).includes("$ bash"))
    })

    test("no ellipsis markers anywhere, since there are no runs to continue", () =>
    {
        assert.ok(!run([]).includes("\n…"))
    })
})

describe("shell selection", () => {
    test("shows every session when no ids are given", () =>
    {
        assert.ok(run([]).includes("$ shell"))
    })

    test("ids filter which sessions are shown", () =>
    {
        assert.ok(!run(["cccccc"]).includes("hyprctl"))
        assert.ok(run(["aaaaaa"]).includes("hyprctl"))
    })

    test("sessions are separated by a blank line", () =>
    {
        const lines = run(["aaaaaa", "cccccc"]).split("\n")
        const secondRow = lines.findIndex((l) => l.startsWith("cccccc "))
        assert.equal(lines[secondRow - 1], "")
    })

    test("a session with no shell commands prints only its row", () =>
    {
        assert.equal(run(["bbbbbb"]), run(["bbbbbb"]).split("\n")[0])
    })
})

describe("shell errors", () => {
    test("unknown id surfaces the error", () =>
    {
        assert.throws(() => run(["zzzzzz"]), /no session/i)
    })

    test("output ends without a trailing blank line", () =>
    {
        assert.ok(!run(["cccccc"]).endsWith("\n"))
    })
})
