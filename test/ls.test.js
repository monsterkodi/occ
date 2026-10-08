import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { listSessions } from "../src/query.js"
import { ls } from "../src/ls.js"
import { createStyle } from "../src/style.js"

const { DB_PATH } = fixtures()

const plain = createStyle(false)

const run = (args, width = 80) =>
    ls({ db: openDb(DB_PATH), prefixes: args, width, style: plain })

const stamp = (ms) =>
{
    const d = new Date(ms)
    const pad = (n) => String(n).padStart(2, "0")
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

describe("ls", () => {
    test("no ids lists every session, one row each", () =>
    {
        assert.equal(run([]).split("\n").length, 3)
    })

    test("ids filter the rows", () =>
    {
        const lines = run(["bbbbbb"]).split("\n")
        assert.equal(lines.length, 1)
        assert.ok(lines[0].trimStart().startsWith("bbbbbb"))
    })

    test("a title argument selects rows too", () =>
    {
        const lines = run(["ocls"]).split("\n")
        assert.equal(lines.length, 1)
        assert.ok(lines[0].includes("Coco - ocls"))
    })

    test("ids and titles can be mixed", () =>
    {
        assert.equal(run(["ocls", "bbbbbb"]).split("\n").length, 2)
    })

    test("unknown id surfaces the error", () =>
    {
        assert.throws(() => run(["zzzzzz"]), /no session/i)
    })

    test("output ends without a trailing blank line", () =>
    {
        assert.ok(!run([]).endsWith("\n"))
    })

    test("the date column shows the last turn, not the session start", () =>
    {
        const [session] = listSessions(openDb(DB_PATH), ["aaaaaa"])
        const [row] = run(["aaaaaa"]).split("\n")

        assert.ok(row.includes(stamp(session.time_last)), row)
        assert.ok(!row.includes(stamp(session.time_created)), row)
    })

    test("each row adds up: last turn minus duration is the session start", () =>
    {
        const sessions = listSessions(openDb(DB_PATH), [])
        const rows = run([]).split("\n")

        assert.equal(rows.length, sessions.length)

        const checked = sessions.filter((s) => s.time_last >= s.time_created)
        assert.ok(checked.length > 0, "no session to check")

        checked.forEach((session) =>
        {
            const i = sessions.indexOf(session)
            const [, minutes] = /^ \w{6} +(?:\d\d-\d\d \d\d:\d\d) +(\d+) /.exec(rows[i])
            const start = new Date(session.time_last - Number(minutes) * 60_000)

            assert.ok(
                Math.abs(start - session.time_created) <= 60_000,
                `${session.title}: ${start.toISOString()} vs ${new Date(session.time_created).toISOString()}`,
            )
        })
    })
})
