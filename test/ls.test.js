import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { ls } from "../src/ls.js"
import { createColor } from "../src/render.js"

const { DB_PATH } = fixtures()

const plain = createColor(false)

const run = (args, width = 80) =>
    ls({ db: openDb(DB_PATH), prefixes: args, width, color: plain })

describe("ls", () => {
    test("no ids lists every session, one row each", () =>
    {
        assert.equal(run([]).split("\n").length, 3)
    })

    test("ids filter the rows", () =>
    {
        const lines = run(["bbbbbb"]).split("\n")
        assert.equal(lines.length, 1)
        assert.ok(lines[0].startsWith("bbbbbb"))
    })

    test("unknown id surfaces the error", () =>
    {
        assert.throws(() => run(["zzzzzz"]), /no session/i)
    })

    test("output ends without a trailing blank line", () =>
    {
        assert.ok(!run([]).endsWith("\n"))
    })
})
