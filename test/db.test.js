import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures } from "./fixtures/build.js"
import { resolveDbPath, openDb, OclsError } from "../src/db.js"

const { DB_PATH, BAD_SCHEMA_DB_PATH, MISSING_COLUMN_DB_PATH } = fixtures()

describe("resolveDbPath", () => {
  test("uses XDG_DATA_HOME when set", () => {
    assert.equal(
      resolveDbPath({ XDG_DATA_HOME: "/xdg" }),
      "/xdg/opencode/opencode.db",
    )
  })

  test("falls back to ~/.local/share", () => {
    assert.equal(
      resolveDbPath({}),
      `${process.env.HOME}/.local/share/opencode/opencode.db`,
    )
  })
})

describe("openDb", () => {
  test("opens the fixture read-only", () => {
    const db = openDb(DB_PATH)
    assert.equal(db.prepare("SELECT count(*) c FROM session_v2").get().c, 4)
    assert.throws(() => db.prepare("DELETE FROM session_v2").run(), /readonly/i)
    db.close()
  })

  test("missing file gives a clear error", () => {
    assert.throws(
      () => openDb("/nonexistent/opencode.db"),
      (e) => e instanceof OclsError && /no database/i.test(e.message),
    )
  })

  test("unrecognized schema gives a clear error", () => {
    assert.throws(
      () => openDb(BAD_SCHEMA_DB_PATH),
      (e) => e instanceof OclsError && /schema/i.test(e.message),
    )
  })

  test("missing required column gives a clear error", () => {
    assert.throws(
      () => openDb(MISSING_COLUMN_DB_PATH),
      (e) => e instanceof OclsError && /time_updated/.test(e.message),
    )
  })
})
