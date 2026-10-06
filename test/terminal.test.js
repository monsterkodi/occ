import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { createTerminal } from "../src/terminal.js"

describe("createTerminal", () => {
  test("writes through to the writer it was given", () => {
    const chunks = []
    const terminal = createTerminal({ write: (s) => chunks.push(s) }, false)
    terminal.write("hello")
    assert.deepEqual(chunks, ["hello"])
  })

  test("reports interactivity as given", () => {
    assert.equal(createTerminal({ write() {} }, true).interactive, true)
    assert.equal(createTerminal({ write() {} }, false).interactive, false)
  })

  test("defaults to non-interactive when stdin is not a terminal", () => {
    assert.equal(createTerminal({ write() {} }).interactive, false)
  })
})
