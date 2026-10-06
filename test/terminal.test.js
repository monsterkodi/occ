import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { createTerminal } from "../src/terminal.js"

const sink = () =>
{
    const chunks = []
    return { chunks, write: (text) => chunks.push(text) }
}

describe("createTerminal", () => {
    test("writes through to the writer it was given", () =>
    {
        const out = sink()
        createTerminal(out, false).write("hello")
        assert.deepEqual(out.chunks, ["hello"])
    })

    test("reports interactivity as given", () =>
    {
        assert.equal(createTerminal(sink(), true).interactive, true)
        assert.equal(createTerminal(sink(), false).interactive, false)
    })

    test("defaults to non-interactive when stdin is not a terminal", () =>
    {
        assert.equal(createTerminal(sink()).interactive, false)
    })
})
