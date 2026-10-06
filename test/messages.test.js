import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures, BASE } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { listSessions, getSession } from "../src/query.js"

const { DB_PATH } = fixtures()

const db = openDb(DB_PATH)

const A = "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"

const turns = (rows) => rows.map((t) => [t.role, t.agent, t.text])

describe("getSession messages", () => {
  test("returns only user and agent turns, in order", () => {
    assert.deepEqual(turns(getSession(db, A).messages), [
      ["user", null, "hello"],
      ["agent", "plan", "hi there"],
      ["user", null, "again"],
      ["agent", "build", "first bit\n\nsecond bit"],
      ["agent", null, "no agent field"],
      ["agent", "plan", ""],
    ])
  })

  test("drops reasoning, tool parts, synthetic and idle messages", () => {
    const texts = getSession(db, A).messages.map((t) => t.text).join("\n")
    assert.ok(!texts.includes("thinking about the greeting"))
    assert.ok(!texts.includes("system note"))
    assert.ok(!texts.includes("only thinking"))
  })

  test("an agent message with no text part comes through empty", () => {
    const empty = getSession(db, A).messages.at(-1)
    assert.equal(empty.role, "agent")
    assert.equal(empty.agent, "plan")
    assert.equal(empty.text, "")
  })

  test("agent turn carries the agent field, user turn has none", () => {
    const [first, second] = getSession(db, A).messages
    assert.equal(first.role, "user")
    assert.equal(first.agent, null)
    assert.equal(second.role, "agent")
    assert.equal(second.agent, "plan")
  })

  test("a session whose only message is empty has nothing to render", () => {
    assert.deepEqual(
      getSession(db, "ses_bbbbbbbbbbbbbbbbbbbbbbb2").messages.map((t) => t.text),
      [""],
    )
  })

  test("unknown session id is an error", () => {
    assert.throws(() => getSession(db, "nope"), /no session/i)
  })

  test("the row is the same one listSessions returns", () => {
    const [fromList] = listSessions(db, ["aaaaaa"])
    const row = getSession(db, A)
    assert.equal(row.id, fromList.id)
    assert.equal(row.title, fromList.title)
    assert.equal(row.turns, fromList.turns)
    assert.equal(row.time_created, BASE)
  })
})
