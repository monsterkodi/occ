import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { fixtures, BASE } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { listSessions, OclsError } from "../src/query.js"

const { DB_PATH } = fixtures()

const db = openDb(DB_PATH)

const ids = () => listSessions(db, []).map((s) => s.id)

const A = "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"
const C = "ses_ccccccccccccccccccccccc3"

describe("listSessions filtering", () => {
    test("returns every top-level session, oldest last message first", () =>
    {
        assert.deepEqual(ids(), [
            "ses_bbbbbbbbbbbbbbbbbbbbbbb2",
            "ses_ccccccccccccccccccccccc3",
            "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1",
        ])
    })

    test("excludes child sessions", () =>
    {
        assert.ok(!ids().includes("ses_ddddddddddddddddddddddd4"))
    })

    test("carries the directory the session runs in", () =>
    {
        const byId = (id) => listSessions(db, [id])[0]
        assert.equal(byId(A).directory, "/home/kodi/a/coco")
        assert.equal(byId("ses_bbbbbbbbbbbbbbbbbbbbbbb2").directory, "/home/kodi/.config")
    })

    test("filters by a 6-character prefix", () =>
    {
        const found = listSessions(db, ["cccccc"])
        assert.equal(found.length, 1)
        assert.equal(found[0].id, "ses_ccccccccccccccccccccccc3")
    })

    test("accepts a prefix with the ses_ prefix included", () =>
    {
        assert.equal(listSessions(db, ["ses_aaaaaa"]).length, 1)
    })

    test("matches several prefixes at once, keeping the query order", () =>
    {
        assert.deepEqual(
            listSessions(db, ["ccccccc", "aaaaaaa"]).map((s) => s.id),
            ["ses_ccccccccccccccccccccccc3", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"],
        )
    })

    test("matches a title substring, case insensitive", () =>
    {
        assert.deepEqual(listSessions(db, ["ocls"]).map((s) => s.id), [A])
        assert.deepEqual(listSessions(db, ["OCLS"]).map((s) => s.id), [A])
        assert.deepEqual(listSessions(db, ["Coco"]).map((s) => s.id), [A])
    })

    test("matches anywhere in a title, not only the start", () =>
    {
        assert.deepEqual(listSessions(db, ["hyprsession"]).map((s) => s.id), [C])
        assert.deepEqual(listSessions(db, ["hypr"]).map((s) => s.id), [C])
    })

    test("an id still wins over a title", () =>
    {
        assert.deepEqual(listSessions(db, ["aaaaaaa"]).map((s) => s.id), [A])
    })

    test("ids and titles can be mixed, in the order given", () =>
    {
        assert.deepEqual(
            listSessions(db, ["conny", "aaaaaaa"]).map((s) => s.id),
            [C, A],
        )
        assert.deepEqual(
            listSessions(db, ["aaaaaaa", "conny"]).map((s) => s.id),
            [A, C],
        )
    })

    test("overlapping title arguments list a session once", () =>
    {
        assert.deepEqual(listSessions(db, ["ocls", "coco"]).map((s) => s.id), [A])
    })

    test("title search never finds a child session", () =>
    {
        assert.throws(() => listSessions(db, ["child"]), /no session/i)
    })

    test("an ambiguous id prefix does not fall through to titles", () =>
    {
        assert.throws(
            () => listSessions(db, ["ses_"]),
            /matches \d+ sessions/i,
        )
    })

    test("sql wildcards in an argument stay literal", () =>
    {
        assert.throws(() => listSessions(db, ["%"]), /no session/i)
        assert.throws(() => listSessions(db, ["_"]), /no session/i)
    })

    test("a term matching nothing is an error", () =>
    {
        assert.throws(() => listSessions(db, ["zzzzzz"]), /no session/i)
    })

    test("unknown prefix is an error", () =>
    {
        assert.throws(
            () => listSessions(db, ["zzzzzz"]),
            (e) => e instanceof OclsError && /no session/i.test(e.message),
        )
    })

    test("ambiguous prefix is an error", () =>
    {
        assert.throws(
            () => listSessions(db, ["ses_"]),
            (e) => e instanceof OclsError && /matches \d+ sessions/i.test(e.message),
        )
    })
})

describe("listSessions ordering", () => {
    test("follows the last message, not the update time", () =>
    {
        const rows = listSessions(db, [])
        const byId = Object.fromEntries(rows.map((s) => [s.id, s]))

        // ses_a… has the newest message but the oldest update time, ses_c… the reverse
        assert.ok(byId[A].time_last > byId[C].time_last)
        assert.ok(byId[A].time_updated < byId[C].time_updated)
        assert.equal(rows.at(-1).id, A)
    })

    test("a session with no messages sorts on its update time", () =>
    {
        const empty = new DatabaseSync(":memory:")
        empty.exec(`
          CREATE TABLE session_v2 (
            id text PRIMARY KEY, parent_id text, title text, directory text,
            time_created integer NOT NULL, time_updated integer NOT NULL
          );
          CREATE TABLE session_message (
            id text PRIMARY KEY, session_id text NOT NULL, type text NOT NULL,
            seq integer NOT NULL, time_created integer NOT NULL, data text NOT NULL
          );
        `)
        const insert = empty.prepare(
            "INSERT INTO session_v2 (id, parent_id, title, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?)",
        )
        insert.run("ses_1111111111111111111111a", null, "Old, touched late", "/home/kodi/a/coco", BASE, BASE + 9 * 3_600_000)
        insert.run("ses_2222222222222222222222b", null, "New, touched early", "/home/kodi/a/coco", BASE, BASE + 60_000)

        const message = empty.prepare(
            "INSERT INTO session_message (id, session_id, type, seq, time_created, data) VALUES (?, ?, ?, ?, ?, ?)",
        )
        message.run("m1", "ses_2222222222222222222222b", "user", 1, BASE + 5 * 3_600_000, '{"text":"hi"}')

        assert.deepEqual(listSessions(empty, []).map((s) => s.id), [
            "ses_2222222222222222222222b",
            "ses_1111111111111111111111a",
        ])
        empty.close()
    })
})

describe("listSessions row data", () => {
    test("counts turns from user messages with text only", () =>
    {
        const byId = Object.fromEntries(listSessions(db, []).map((s) => [s.id, s.turns]))
        assert.equal(byId["ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"], 2)
        assert.equal(byId["ses_bbbbbbbbbbbbbbbbbbbbbbb2"], 0)
        assert.equal(byId["ses_ccccccccccccccccccccccc3"], 1)
    })

    test("null title comes through as null", () =>
    {
        const second = listSessions(db, ["bbbbbb"])[0]
        assert.equal(second.title, null)
        assert.equal(second.time_created, BASE + 120_000)
        assert.equal(second.time_updated, BASE + 180_000)
    })

    test("time_last is the time of the newest message", () =>
    {
        const byId = Object.fromEntries(listSessions(db, []).map((s) => [s.id, s.time_last]))
        assert.equal(byId[A], BASE + 7 * 1000)
        assert.equal(byId["ses_bbbbbbbbbbbbbbbbbbbbbbb2"], BASE + 2 * 1000)
        assert.equal(byId[C], BASE + 4 * 1000)
    })

    test("time_last falls back to the update time of a session with no messages", () =>
    {
        const empty = new DatabaseSync(":memory:")
        empty.exec(`
          CREATE TABLE session_v2 (
            id text PRIMARY KEY, parent_id text, title text, directory text,
            time_created integer NOT NULL, time_updated integer NOT NULL
          );
          CREATE TABLE session_message (
            id text PRIMARY KEY, session_id text NOT NULL, type text NOT NULL,
            seq integer NOT NULL, time_created integer NOT NULL, data text NOT NULL
          );
        `)
        empty
            .prepare(
                "INSERT INTO session_v2 (id, parent_id, title, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?)",
            )
            .run("ses_eeeeeeeeeeeeeeeeeeeeeee5", null, "Empty", "/home/kodi/a/coco", BASE, BASE + 42)

        const [row] = listSessions(empty, [])
        assert.equal(row.time_last, BASE + 42)
        empty.close()
    })
})
