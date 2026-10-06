import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { log } from "../src/log.js"
import { createColor } from "../src/render.js"

const { DB_PATH } = fixtures()

const plain = createColor(false)
const run = (ids, width = 80) =>
  log({ db: openDb(DB_PATH), prefixes: ids, width, color: plain })

const markers = (out) => out.split("\n").filter((l) => l.startsWith(">") || l.startsWith("$"))

describe("log", () => {
  test("starts with the session row, then the blocks", () => {
    const lines = run(["aaaaaa"]).split("\n")
    assert.ok(lines[0].startsWith("aaaaaa "))
    assert.equal(lines[1], "> user")
    assert.equal(lines[2], "hello")
  })

  test("shows tool calls and results inline, in order", () => {
    assert.deepEqual(markers(run(["aaaaaa"])), [
      "> user",
      "> agent plan",
      "$ shell",
      "$ shell result",
      "> user",
      "> agent build",
      "$ shell",
      "$ webfetch",
      "$ webfetch result",
      "$ grep",
      "$ read",
      "$ read result",
    ])
  })

  test("an assistant message with no agent field continues the run", () => {
    const lines = run(["aaaaaa"]).split("\n")
    const turn = lines.indexOf("no agent field")
    assert.equal(lines[turn - 1], "…")
  })

  test("agent text after a tool call continues with an ellipsis", () => {
    const lines = run(["aaaaaa"]).split("\n")
    const result = lines.indexOf("$ shell result")
    const cont = lines.indexOf("…", result)
    assert.ok(cont > result)
    assert.equal(lines[cont + 1], "done listing")
  })

  test("shows every session when no ids are given", () => {
    assert.ok(run([]).includes("$ webfetch"))
    assert.ok(run([]).includes("$ shell"))
  })

  test("ids filter which sessions are shown", () => {
    assert.ok(!run(["cccccc"]).includes("$ webfetch"))
  })

  test("ids keep the order they were given in", () => {
    const out = run(["bbbbbb", "aaaaaa"])
    assert.ok(out.indexOf("bbbbbb") < out.indexOf("aaaaaa"))
  })

  test("sessions are separated by a blank line", () => {
    const lines = run(["aaaaaa", "cccccc"]).split("\n")
    const secondRow = lines.findIndex((l) => l.startsWith("cccccc "))
    assert.equal(lines[secondRow - 1], "")
  })

  test("a session with no renderable blocks prints only its row", () => {
    assert.equal(run(["bbbbbb"]), run(["bbbbbb"]).split("\n")[0])
  })

  test("unknown id surfaces the error", () => {
    assert.throws(() => run(["zzzzzz"]), /no session/i)
  })

  test("output ends without a trailing blank line", () => {
    assert.ok(!run(["aaaaaa"]).endsWith("\n"))
  })
})
