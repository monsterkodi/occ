import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { createStyle } from "../src/style.js"

const strip = (text) => text.replace(/\x1b\[[0-9;]*m/g, "")

const groups = ["row", "turn", "tool", "del"]

const HEX = new Set(["fg", "bg"])

function walk(style, prefix = "", found = [])
{
    for (const [key, value] of Object.entries(style))
    {
        if (key === "enabled" || key === "palette" || HEX.has(key)) continue
        const path = prefix ? `${prefix}.${key}` : key
        if (typeof value === "function") found.push(path)
        else walk(value, path, found)
    }
    return found
}

describe("createStyle", () => {
    test("exposes the same roles whether or not color is on", () =>
    {
        assert.deepEqual(walk(createStyle(true)), walk(createStyle(false)))
    })

    test("every role is a function of text", () =>
    {
        for (const role of walk(createStyle(true)))
        {
            const fn = role.split(".").reduce((acc, key) => acc[key], createStyle(true))
            assert.equal(typeof fn, "function", `${role} is not a function`)
            assert.equal(typeof fn("x"), "string")
        }
    })

    test("reports whether color is enabled", () =>
    {
        assert.equal(createStyle(true).enabled, true)
        assert.equal(createStyle(false).enabled, false)
    })

    test("each expected role exists", () =>
    {
        const style = createStyle(true)
        for (const group of groups) assert.ok(style[group], `missing group ${group}`)
        assert.deepEqual(Object.keys(style.row), ["id", "last", "duration", "turns", "name"])
        assert.deepEqual(Object.keys(style.turn), ["user", "agent", "mode", "continue"])
        assert.deepEqual(Object.keys(style.tool), ["call", "result", "exit", "note"])
        assert.deepEqual(Object.keys(style.del), ["warning", "question"])
    })

    test("disabled style returns the text unchanged", () =>
    {
        const style = createStyle(false)
        for (const role of walk(style))
        {
            const fn = role.split(".").reduce((acc, key) => acc[key], style)
            assert.equal(fn("plain text"), "plain text", role)
        }
    })

    test("enabled style returns the same visible text", () =>
    {
        const style = createStyle(true)
        for (const role of walk(style))
        {
            const fn = role.split(".").reduce((acc, key) => acc[key], style)
            assert.equal(strip(fn("plain text")), "plain text", role)
        }
    })

    test("a dim role wraps text without changing it", () =>
    {
        const out = createStyle(true).turn.continue("…")
        assert.notEqual(out, "…")
        assert.equal(strip(out), "…")
    })

    test("nested styles compose rather than replace", () =>
    {
        const style = createStyle(true)
        const inner = style.turn.mode("build")
        const outer = style.tool.result(inner)
        assert.notEqual(inner, outer)
        assert.ok(strip(outer).includes("build"))
    })

    test("styling is applied consistently across runs", () =>
    {
        const a = createStyle(true)
        const b = createStyle(true)
        assert.equal(a.turn.user("> user"), b.turn.user("> user"))
    })
})
