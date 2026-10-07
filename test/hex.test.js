import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { createStyle, StyleError } from "../src/style.js"

const strip = (text) => text.replace(/\x1b\[[0-9;]*m/g, "")

const style = createStyle(true)
const plain = createStyle(false)

describe("fg and bg with hex", () => {
    test("fg emits a 24-bit foreground sequence", () =>
    {
        assert.equal(style.fg("#0000ff", "x"), "\x1b[38;2;0;0;255mx\x1b[39m")
    })

    test("bg emits a 24-bit background sequence", () =>
    {
        assert.equal(style.bg("#ff0000", "x"), "\x1b[48;2;255;0;0mx\x1b[49m")
    })

    test("three digit shorthand expands to pairs", () =>
    {
        assert.equal(style.fg("#00f", "x"), style.fg("#0000ff", "x"))
        assert.equal(style.bg("#f00", "x"), style.bg("#ff0000", "x"))
    })

    test("uppercase and a missing hash are accepted", () =>
    {
        assert.equal(style.fg("#0000FF", "x"), style.fg("#0000ff", "x"))
        assert.equal(style.fg("00ff00", "x"), style.fg("#00ff00", "x"))
    })

    test("four digits are rejected as neither rgb nor rrggbb", () =>
    {
        assert.throws(() => style.fg("#00FF", "x"), StyleError)
    })

    test("nesting preserves the visible text", () =>
    {
        const out = style.bg("#ff0000", style.fg("#ffff00", "hi"))
        assert.equal(strip(out), "hi")
    })

    test("fg nests inside another role", () =>
    {
        const out = style.fg("#0000ff", style.turn.user("> user"))
        assert.equal(strip(out), "> user")
        assert.ok(out.includes("38;2;0;0;255"))
        assert.ok(out.includes("44"))
    })

    test("a role can be built from hex, foreground inside background", () =>
    {
        const c = (text) => style.bg("#1e40af", style.fg("#ffffff", style.turn.user(text)))
        assert.equal(strip(c("> user")), "> user")
        assert.ok(c("> user").includes("48;2;30;64;175"))
    })
})

describe("fg and bg when color is off", () => {
    test("fg returns the text, not the hex", () =>
    {
        assert.equal(plain.fg("#0000ff", "hello"), "hello")
    })

    test("bg returns the text, not the hex", () =>
    {
        assert.equal(plain.bg("#ff0000", "hello"), "hello")
    })

    test("no escape codes are emitted", () =>
    {
        assert.equal(strip(plain.fg("#0000ff", "x")), "x")
        assert.equal(strip(plain.bg("#ff0000", "x")), "x")
    })

    test("a role using fg does not leak the hex when color is off", () =>
    {
        const name = (text) => plain.fg("#00ff00", text)
        assert.equal(name("name"), "name")
    })
})

describe("palette", () => {
    test("exposes the named codes alongside fg and bg", () =>
    {
        assert.equal(typeof style.palette.bold, "function")
        assert.equal(typeof style.palette.gray, "function")
        assert.equal(typeof style.palette.fg, "function")
        assert.equal(typeof style.palette.bg, "function")
    })

    test("fg composes with a named code the way a role author writes it", () =>
    {
        const out = style.fg("#0000ff", style.palette.bold("hi"))
        assert.equal(strip(out), "hi")
        assert.ok(out.includes("38;2;0;0;255"))
        assert.ok(out.includes("\x1b[1m"))
    })

    test("bg composes with fg for a foreground on a background", () =>
    {
        const out = style.bg("#ff0000", style.fg("#ffff00", "hi"))
        assert.equal(strip(out), "hi")
        assert.ok(out.includes("48;2;255;0;0"))
        assert.ok(out.includes("38;2;255;255;0"))
    })

    test("the palette follows the color setting too", () =>
    {
        assert.equal(plain.palette.bold("hi"), "hi")
        assert.notEqual(style.palette.bold("hi"), "hi")
    })
})

describe("hex validation", () => {
    const bad = ["#12345", "#1234567", "#gggggg", "blue", "", "#"]

    for (const value of bad)
    {
        test(`rejects ${JSON.stringify(value)}`, () =>
        {
            assert.throws(() => style.fg(value, "x"), StyleError)
        })
    }

    test("rejects a non-string", () =>
    {
        assert.throws(() => style.fg(255, "x"), StyleError)
        assert.throws(() => style.bg(null, "x"), StyleError)
    })

    test("rejects eight digit hex with a message mentioning alpha", () =>
    {
        assert.throws(() => style.fg("#0000ffff", "x"), /hex|rgb/i)
    })

    test("the error names the offending value", () =>
    {
        assert.throws(() => style.fg("#zzzzzz", "x"), /#zzzzzz/)
    })

    test("nothing is validated while color is off, since nothing is applied", () =>
    {
        assert.equal(plain.fg("nope", "x"), "x")
    })
})
