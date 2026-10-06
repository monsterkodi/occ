import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures, BASE } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { listSessions, OclsError } from "../src/query.js"

const { DB_PATH } = fixtures()

const db = openDb(DB_PATH)

const ids = () => listSessions(db, []).map((s) => s.id)

describe("listSessions", () => {
  test("returns every top-level session, oldest update first", () => {
    assert.deepEqual(ids(), [
      "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1",
      "ses_bbbbbbbbbbbbbbbbbbbbbbb2",
      "ses_ccccccccccccccccccccccc3",
    ])
  })

  test("excludes child sessions", () => {
    assert.ok(!ids().includes("ses_ddddddddddddddddddddddd4"))
  })

  test("filters by a 6-character prefix", () => {
    const found = listSessions(db, ["cccccc"])
    assert.equal(found.length, 1)
    assert.equal(found[0].id, "ses_ccccccccccccccccccccccc3")
  })

  test("accepts a prefix with the ses_ prefix included", () => {
    assert.equal(listSessions(db, ["ses_aaaaaa"]).length, 1)
  })

  test("matches several prefixes at once, keeping the query order", () => {
    assert.deepEqual(
      listSessions(db, ["ccccccc", "aaaaaaa"]).map((s) => s.id),
      ["ses_ccccccccccccccccccccccc3", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"],
    )
  })

  test("unknown prefix is an error", () => {
    assert.throws(
      () => listSessions(db, ["zzzzzz"]),
      (e) => e instanceof OclsError && /no session/i.test(e.message),
    )
  })

  test("ambiguous prefix is an error", () => {
    assert.throws(
      () => listSessions(db, ["ses_"]),
      (e) => e instanceof OclsError && /matches \d+ sessions/i.test(e.message),
    )
  })

  test("counts turns from user messages with text only", () => {
    const byId = Object.fromEntries(listSessions(db, []).map((s) => [s.id, s.turns]))
    assert.equal(byId["ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"], 2)
    assert.equal(byId["ses_bbbbbbbbbbbbbbbbbbbbbbb2"], 0)
    assert.equal(byId["ses_ccccccccccccccccccccccc3"], 1)
  })

  test("null title comes through as null", () => {
    const second = listSessions(db, ["bbbbbb"])[0]
    assert.equal(second.title, null)
    assert.equal(second.time_created, BASE + 120_000)
    assert.equal(second.time_updated, BASE + 180_000)
  })
})
