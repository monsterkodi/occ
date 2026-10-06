import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { renderTurns, createColor } from "../src/render.js"

const plain = createColor(false)

const turns = [
  { role: "user", agent: null, text: "hello coco" },
  { role: "agent", agent: "plan", text: "hello!" },
  { role: "user", agent: null, text: "you made a mistake" },
  { role: "agent", agent: "plan", text: "i check for mistake on disk" },
  { role: "agent", agent: "build", text: "what should i build?" },
]

describe("renderTurns", () => {
  test("each turn is preceded by a marker line", () => {
    assert.equal(
      renderTurns(turns, plain),
      [
        "> user",
        "hello coco",
        "> agent plan",
        "hello!",
        "> user",
        "you made a mistake",
        "> agent plan",
        "i check for mistake on disk",
        "> agent build",
        "what should i build?",
      ].join("\n"),
    )
  })

  test("turn text starts at the left margin", () => {
    for (const line of renderTurns(turns, plain).split("\n")) {
      assert.ok(!line.startsWith(" "), `indented line: ${JSON.stringify(line)}`)
    }
  })

  test("no blank lines are inserted between turns", () => {
    assert.ok(!renderTurns(turns, plain).includes("\n\n"))
  })

  test("agent turn without an agent field still gets a marker", () => {
    const out = renderTurns([{ role: "agent", agent: null, text: "hi" }], plain)
    assert.equal(out, "> agent\nhi")
  })

  test("multiline text is kept verbatim", () => {
    const text = "line one\n\n  indented\ntrailing spaces   "
    const out = renderTurns([{ role: "user", agent: null, text }], plain)
    assert.equal(out, `> user\n${text.trimEnd()}`)
  })

  test("an empty list renders as nothing", () => {
    assert.equal(renderTurns([], plain), "")
  })

  test("whitespace-only turns render as nothing, not a bare marker", () => {
    const out = renderTurns([{ role: "user", agent: null, text: "   \n  " }], plain)
    assert.equal(out, "")
  })

  test("colors leave the visible text untouched", () => {
    const colored = createColor(true)
    assert.equal(
      renderTurns(turns, colored).replace(/\x1b\[[0-9;]*m/g, ""),
      renderTurns(turns, plain),
    )
  })

  test("user and agent markers are colored differently", () => {
    const colored = createColor(true)
    const out = renderTurns(turns, colored)
    const userLine = out.split("\n")[0]
    const agentLine = out.split("\n")[2]
    assert.notEqual(userLine, agentLine)
    assert.ok(userLine.includes("\x1b["))
    assert.ok(agentLine.includes("\x1b["))
  })
})
