import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { cat } from "../src/cat.js"
import { createStyle } from "../src/style.js"

const { DB_PATH } = fixtures()

const plain = createStyle(false)

const run = (ids, width = 80) =>
    cat({ db: openDb(DB_PATH), prefixes: ids, width, style: plain })

describe("cat", () => {
    test("starts with the session row, then the turns", () =>
    {
        const lines = run(["aaaaaa"]).split("\n")
        assert.ok(lines[0].startsWith("aaaaaa "))
        assert.equal(lines[1], "> user")
        assert.equal(lines[2], "hello")
    })

    test("shows no tool calls or results at all", () =>
    {
        const out = run(["aaaaaa"])
        assert.ok(!out.includes("$ "))
        assert.ok(!out.includes("hyprctl"))
    })

    test("text on both sides of a tool call joins into one turn", () =>
    {
        const out = run(["aaaaaa"])
        assert.ok(out.includes("hi there\n\ndone listing"))
        assert.ok(!out.includes("total 48"))
    })

    test("consecutive text parts in one message still join with a blank line", () =>
    {
        assert.ok(run(["aaaaaa"]).includes("first bit\n\nsecond bit"))
    })
})

describe("cat selection", () => {
    test("shows every session when no ids are given", () =>
    {
        const out = run([])
        assert.ok(out.includes("> user"))
        assert.equal(out.split("\n").filter((l) => l === "> user").length, 3)
    })

    test("ids filter which sessions are shown", () =>
    {
        const out = run(["cccccc"])
        assert.ok(!out.includes("hello"))
        assert.ok(out.includes("> user"))
    })

    test("ids keep the order they were given in", () =>
    {
        const out = run(["bbbbbb", "aaaaaa"])
        assert.ok(out.indexOf("bbbbbb") < out.indexOf("aaaaaa"))
    })

    test("sessions are separated by a blank line, not a rule", () =>
    {
        const lines = run(["aaaaaa", "cccccc"]).split("\n")
        const secondRow = lines.findIndex((l) => l.startsWith("cccccc "))
        assert.equal(lines[secondRow - 1], "")
    })

    test("a session with no renderable turns prints only its row", () =>
    {
        assert.equal(run(["bbbbbb"]), run(["bbbbbb"]).split("\n")[0])
    })
})

describe("cat errors", () => {
    test("unknown id surfaces the error", () =>
    {
        assert.throws(() => run(["zzzzzz"]), /no session/i)
    })

    test("output ends without a trailing blank line", () =>
    {
        assert.ok(!run(["aaaaaa"]).endsWith("\n"))
    })
})
