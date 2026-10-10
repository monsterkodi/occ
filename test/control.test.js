import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fixtures, CONTROL_RESULT, CONTROL_TITLE, CONTROL_SESSION } from "./fixtures/build.js"
import { openDb } from "../src/db.js"
import { shell } from "../src/shell.js"
import { log } from "../src/log.js"
import { ls } from "../src/ls.js"
import { renderBlocks, renderSession } from "../src/render.js"
import { escapeControl } from "../src/escape.js"
import { createStyle } from "../src/style.js"

const { CONTROL_DB_PATH } = fixtures()

const plain = createStyle(false)

// every byte an escape function has to deal with: nul, the C0 controls that
// are not tab, newline or the escape byte, and delete
const CONTROL_BYTES = /[\0-\x08\x0b-\x1a\x1c-\x1f\x7f]/

const run = (command) =>
    command({ db: openDb(CONTROL_DB_PATH), prefixes: ["eeeeee"], width: 80, style: plain })

const bytesOf = (text) => [...Buffer.from(text, "utf8")]

describe("escapeControl", () => {
    test("leaves printable text alone", () =>
    {
        assert.equal(escapeControl("plain text 123 !?"), "plain text 123 !?")
    })

    test("keeps tab and newline, since they are layout, not noise", () =>
    {
        assert.equal(escapeControl("a\tb\nc"), "a\tb\nc")
    })

    test("escapes nul as a hex byte", () =>
    {
        assert.equal(escapeControl("a\0b"), "a\\x00b")
    })

    test("escapes every other c0 control as hex", () =>
    {
        const c0 = Array.from({ length: 0x20 }, (_, i) => String.fromCharCode(i))
            .filter((c) => !"\t\n\x1b".includes(c))
            .join("")

        for (const c of c0)
        {
            const hex = c.charCodeAt(0).toString(16).padStart(2, "0")
            assert.equal(escapeControl(`a${c}b`), `a\\x${hex}b`, `charcode ${c.charCodeAt(0)}`)
        }
    })

    test("escapes delete", () =>
    {
        assert.equal(escapeControl("a\x7fb"), "a\\x7fb")
    })

    test("keeps the ansi escape byte, since colors are output to keep", () =>
    {
        assert.equal(escapeControl("\x1b[31mred\x1b[39m"), "\x1b[31mred\x1b[39m")
    })

    test("leaves multibyte text untouched", () =>
    {
        assert.equal(escapeControl("héllo → 🎉"), "héllo → 🎉")
    })

    test("coerces a non-string", () =>
    {
        assert.equal(escapeControl(42), "42")
        assert.equal(escapeControl(null), "null")
    })

    test("output never carries a control byte other than tab and newline", () =>
    {
        for (const c of Array.from({ length: 0x80 }, (_, i) => String.fromCharCode(i)))
        {
            const out = escapeControl(`a${c}b`)
            const bad = bytesOf(out).filter((b) => b === 0x09 || b === 0x0a || b === 0x1b ? false : b < 0x20 || b === 0x7f)
            assert.deepEqual(bad, [], `charcode ${c.charCodeAt(0)} leaked`)
        }
    })
})

describe("control bytes in a session", () => {
    test("the raw fixture result really does contain the offending bytes", () =>
    {
        assert.ok(bytesOf(CONTROL_RESULT).includes(0x00))
        assert.ok(bytesOf(CONTROL_TITLE).includes(0x00))
    })

    for (const [name, command] of [["shell", shell], ["log", log]])
    {
        test(`${name} output holds no control byte that breaks grep`, () =>
        {
            const out = run(command)
            assert.ok(!CONTROL_BYTES.test(out), JSON.stringify(out))
        })

        test(`${name} shows the nul bytes as \\x00`, () =>
        {
            assert.ok(run(command).includes("\\x00"), run(command))
        })
    }

    test("the escaped result keeps its tabs, newlines and colors", () =>
    {
        const out = run(shell)

        assert.ok(out.includes("tab\there"))
        assert.ok(out.includes("<anonymous_script>:1\n"))
        assert.ok(out.includes("\x1b[31mred\x1b[39m"))
    })

    test("a session title with control bytes is escaped in the table", () =>
    {
        const out = ls({ db: openDb(CONTROL_DB_PATH), prefixes: [], width: 80, style: plain })

        assert.ok(!CONTROL_BYTES.test(out), JSON.stringify(out))
        assert.ok(out.includes(CONTROL_TITLE.replace("\0", "\\x00")), JSON.stringify(out))
    })

    test("a command carrying control bytes is escaped too", () =>
    {
        const blocks = [
            { kind: "call", name: "shell", agent: null, command: "printf '\0'" },
            { kind: "result", name: "shell", text: "ok", outputPath: null },
        ]

        const out = renderBlocks(blocks, plain)
        assert.ok(!CONTROL_BYTES.test(out), JSON.stringify(out))
        assert.ok(out.includes("printf '\\x00'"), JSON.stringify(out))
    })

    test("a truncated result's output path is escaped as well", () =>
    {
        const blocks = [
            { kind: "call", name: "read", agent: null, command: "cat f" },
            {
                kind: "result",
                name: "read",
                text: "head",
                outputPath: "/tmp/out\0put",
            },
        ]

        const out = renderBlocks(blocks, plain)
        assert.ok(!CONTROL_BYTES.test(out), JSON.stringify(out))
        assert.ok(out.includes("/tmp/out\\x00put"), JSON.stringify(out))
    })

    test("the row renderer escapes a title before it is cropped", () =>
    {
        const out = renderSession(
            {
                id: CONTROL_SESSION,
                title: "x".repeat(79) + "\0",
                time_created: 1791283494422,
                time_updated: 1791283494422 + 60_000,
                time_last: 1791283494422 + 60_000,
                turns: 1,
            },
            80,
            plain,
        )

        assert.ok(!CONTROL_BYTES.test(out), JSON.stringify(out))
        assert.equal(out.length, 80)
    })

    test("escaping survives the round trip through the database", () =>
    {
        const out = run(shell)
        assert.ok(out.includes("\\x00\\x00\\x00 \\x08\\x10\\x00\\x040\\x00\\x00"), JSON.stringify(out))
    })
})