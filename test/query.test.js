import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures, BASE } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { listSessions, OclsError } from "../src/query.js"

const { DB_PATH } = fixtures()

const db = openDb(DB_PATH)

const ids = () => listSessions(db, []).map((s) => s.id)

const A = "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"
const C = "ses_ccccccccccccccccccccccc3"

describe("listSessions filtering", () => {
    test("returns every top-level session, oldest update first", () =>
    {
        assert.deepEqual(ids(), [
            "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1",
            "ses_bbbbbbbbbbbbbbbbbbbbbbb2",
            "ses_ccccccccccccccccccccccc3",
        ])
    })

    test("excludes child sessions", () =>
    {
        assert.ok(!ids().includes("ses_ddddddddddddddddddddddd4"))
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
})
