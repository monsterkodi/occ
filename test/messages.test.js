import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures, BASE } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { listSessions, getSession } from "../src/query.js"

const { DB_PATH } = fixtures()

const db = openDb(DB_PATH)

const A = "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"
const C = "ses_ccccccccccccccccccccccc3"

const blocks = (id) => getSession(db, id).blocks
const brief = (rows) =>
  rows.map((b) => [b.kind, b.kind === "call" ? b.name : b.text])

describe("getSession blocks", () => {
  test("walks messages and parts in order", () => {
    assert.deepEqual(brief(blocks(A)), [
      ["turn", "hello"],
      ["turn", "hi there"],
      ["call", "shell"],
      ["result", "total 48\n---\nHyprland 0.56.2"],
      ["turn", "done listing"],
      ["turn", "again"],
      ["turn", "first bit\n\nsecond bit"],
      ["turn", "no agent field"],
      ["call", "shell"],
      ["call", "webfetch"],
      ["result", "StatusCode: non 2xx status code (404)"],
      ["call", "grep"],
      ["call", "read"],
      ["result", "name: ocls\n"],
    ])
  })

  test("reasoning, synthetic and idle never produce blocks", () => {
    const texts = blocks(A).map((b) => b.text ?? "").join("\n")
    assert.ok(!texts.includes("thinking about the greeting"))
    assert.ok(!texts.includes("only thinking"))
    assert.ok(!texts.includes("system note"))
  })

  test("turn blocks carry the role and agent field", () => {
    const turns = blocks(A).filter((b) => b.kind === "turn")
    assert.equal(turns[0].role, "user")
    assert.equal(turns[0].agent, null)
    assert.equal(turns[1].role, "agent")
    assert.equal(turns[1].agent, "plan")
    assert.equal(turns[4].agent, "build")
    assert.equal(turns[5].agent, null)
  })

  test("consecutive text parts in one message join with a blank line", () => {
    assert.equal(blocks(A).find((b) => b.text === "first bit\n\nsecond bit").kind, "turn")
  })

  test("a call block carries the tool name and its input command", () => {
    const call = blocks(A).find((b) => b.kind === "call")
    assert.equal(call.name, "shell")
    assert.equal(call.command, "ls -la; echo ---; hyprctl version")
  })

  test("a tool with empty output produces no result block", () => {
    const calls = blocks(A).filter((b) => b.kind === "call").length
    const results = blocks(A).filter((b) => b.kind === "result").length
    assert.equal(calls, 5)
    assert.equal(results, 3)
  })

  test("an errored tool puts the error message where the result would be", () => {
    const results = blocks(A).filter((b) => b.kind === "result").map((b) => b.text)
    assert.ok(results.includes("StatusCode: non 2xx status code (404)"))
  })

  test("a running tool produces no result block", () => {
    const names = blocks(A).filter((b) => b.kind === "call").map((b) => b.name)
    assert.ok(names.includes("grep"))
    const results = blocks(A).filter((b) => b.kind === "result").map((b) => b.text)
    assert.ok(!results.some((t) => t === undefined))
    assert.equal(results.length, 3)
  })

  test("a truncated result carries its full output path", () => {
    const truncated = blocks(A).find((b) => b.kind === "result" && b.outputPath)
    assert.equal(truncated.outputPath, "/home/kodi/.local/share/opencode/tool-output/tool_abc")
  })

  test("a non-truncated result has no output path", () => {
    const full = blocks(A).find((b) => b.kind === "result" && b.text.startsWith("total 48"))
    assert.equal(full.outputPath, null)
  })

  test("any tool name is carried through, not just shell", () => {
    const names = blocks(C).filter((b) => b.kind === "call").map((b) => b.name)
    assert.deepEqual(names, ["bash"])
  })

  test("unknown session id is an error", () => {
    assert.throws(() => getSession(db, "nope"), /no session/i)
  })

  test("the row is the same one listSessions returns", () => {
    const [fromList] = listSessions(db, ["aaaaaa"])
    const { row } = getSession(db, A)
    assert.equal(row.id, fromList.id)
    assert.equal(row.title, fromList.title)
    assert.equal(row.turns, fromList.turns)
    assert.equal(row.time_created, BASE)
  })
})
