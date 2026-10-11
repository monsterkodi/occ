import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { listSessions } from "../src/query.js"
import { ls } from "../src/ls.js"
import { createStyle } from "../src/style.js"
import { DatabaseSync } from "node:sqlite"

const { DB_PATH } = fixtures()

const plain = createStyle(false)

const run = (args, width = 80) =>
    ls({ db: openDb(DB_PATH), prefixes: args, width, style: plain })

const runOn = (db, args = [], width = 80) =>
    ls({ db, prefixes: args, width, style: plain })

// a db whose sessions fall on known days, for the date-grouping cases
function daysDb()
{
    const db = new DatabaseSync(":memory:")
    db.exec(`
      CREATE TABLE session_v2 (
        id text PRIMARY KEY, parent_id text, title text, directory text,
        time_created integer NOT NULL, time_updated integer NOT NULL
      );
      CREATE TABLE session_message (
        id text PRIMARY KEY, session_id text NOT NULL, type text NOT NULL,
        seq integer NOT NULL, time_created integer NOT NULL, data text NOT NULL
      );
    `)

    const insert = db.prepare(
        "INSERT INTO session_v2 (id, parent_id, title, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?)",
    )
    const message = db.prepare(
        "INSERT INTO session_message (id, session_id, type, seq, time_created, data) VALUES (?, ?, ?, ?, ?, ?)",
    )

    const at = (month, date, hours) => new Date(2026, month - 1, date, hours, 0, 0, 0).getTime()
    // distinct leading characters, so a short prefix picks exactly one session
const rows = [
        ["1111", 10, 7, 11, "same day first"],
        ["2222", 10, 7, 12, "same day second"],
        ["3333", 10, 11, 8, "next day first"],
        ["4444", 10, 11, 14, "next day second"],
        ["5555", 10, 13, 1, "third day"],
    ]

    for (const [tag, month, date, hours, title] of rows)
    {
        const id = `ses_${tag}${"0".repeat(21)}`
        const last = at(month, date, hours)
        insert.run(id, null, title, "/home/kodi/a/coco", last - 3_600_000, last)
        message.run(`m_${tag}`, id, "user", 1, last, JSON.stringify({ text: "hi" }))
    }

    return db
}

const dateOf = (line) => /^ \w{6} +(\d\d-\d\d)/.exec(line)?.[1]
const timeOf = (line) => /^ \w{6} +(?:\d\d-\d\d)? *(\d\d:\d\d)/.exec(line)?.[1]
const at_ = (line, text) => line.indexOf(text)

const stamp = (ms) =>
{
    const d = new Date(ms)
    const pad = (n) => String(n).padStart(2, "0")
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

describe("ls date grouping", () => {
    test("a session repeating the previous row's date shows spaces instead", () =>
    {
        const lines = runOn(daysDb()).split("\n")

        assert.equal(dateOf(lines[0]), "10-07")
        assert.equal(dateOf(lines[1]), undefined)
        assert.equal(dateOf(lines[2]), "10-11")
        assert.equal(dateOf(lines[3]), undefined)
        assert.equal(dateOf(lines[4]), "10-13")
    })

    test("the time is still printed on a blanked row", () =>
    {
        const lines = runOn(daysDb()).split("\n")
        assert.deepEqual(lines.map(timeOf), ["11:00", "12:00", "08:00", "14:00", "01:00"])
    })

    test("every row keeps its full width when the date is blanked", () =>
    {
        for (const line of runOn(daysDb()).split("\n"))
        {
            assert.equal(line.length, 80, JSON.stringify(line))
        }
    })

    test("the hour is in the same column on blanked and dated rows", () =>
    {
        const lines = runOn(daysDb()).split("\n")

        assert.equal(at_(lines[1], "12:00"), at_(lines[0], "11:00"))
        assert.equal(at_(lines[3], "14:00"), at_(lines[2], "08:00"))
    })

    test("ids are listed with every date shown", () =>
    {
        const lines = runOn(daysDb(), ["2222", "4444"]).split("\n")
        assert.deepEqual(lines.map(dateOf), ["10-07", "10-11"])
    })

    test("a title argument lists with every date shown", () =>
    {
        const lines = runOn(daysDb(), ["same day"]).split("\n")
        assert.deepEqual(lines.map(dateOf), ["10-07", "10-07"])
    })

    test("one row only shows its date", () =>
    {
        const [line] = runOn(daysDb(), ["1111"]).split("\n")
        assert.equal(dateOf(line), "10-07")
    })

    test("a session with no messages groups on its update time", () =>
    {
        const db = daysDb()
        db.prepare(
            "INSERT INTO session_v2 (id, parent_id, title, time_created, time_updated) VALUES (?, ?, ?, ?, ?)",
        ).run(
            "ses_0000000000000000000000006",
            null,
            "no messages",
            new Date(2026, 8, 13, 1, 0, 0, 0).getTime(),
            new Date(2026, 9, 7, 12, 30, 0, 0).getTime(),
        )

        // sorts between the two 10-07 sessions, on its update time of 12:30
        const lines = runOn(db).split("\n")
        assert.deepEqual(lines.map(timeOf), ["11:00", "12:00", "12:30", "08:00", "14:00", "01:00"])
        assert.deepEqual(lines.map(dateOf), ["10-07", undefined, undefined, "10-11", undefined, "10-13"])
        db.close()
    })

    test("the shared fixture groups too", () =>
    {
        const lines = run([]).split("\n")
        const dates = lines.map(dateOf)
        const first = dates.indexOf(undefined)
        assert.ok(first === -1 || first > 0, "a blank date before any printed one")
    })
})

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
            const [, minutes] = /^ \w{6} +(?:\d\d-\d\d)? *\d\d:\d\d +(\d+) /.exec(rows[i])
            const start = new Date(session.time_last - Number(minutes) * 60_000)

            assert.ok(
                Math.abs(start - session.time_created) <= 60_000,
                `${session.title}: ${start.toISOString()} vs ${new Date(session.time_created).toISOString()}`,
            )
        })
    })
})
