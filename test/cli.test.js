import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { makeDataHome } from "./fixtures/build.js"

const run = promisify(execFile)
const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const occ = join(root, "occ")

const { home } = makeDataHome()

const READ_COMMANDS = ["ls", "cat", "log", "shell"]

function occRun(args, env = {})
{
    return run(process.execPath, [occ, ...args], {
        env: { ...process.env, XDG_DATA_HOME: home, NO_COLOR: "1", ...env },
    })
}

function rejectsWith(pattern)
{
    return (e) =>
    {
        assert.equal(e.code, 1)
        assert.match(e.stderr, pattern)
        return true
    }
}

describe("cli read commands", () => {
    for (const command of READ_COMMANDS)
    {
        test(`${command} runs and prints something`, async () =>
        {
            const { stdout } = await occRun([command, "aaaaaa"])
            assert.match(stdout, /aaaaaa/)
        })

        test(`${command} with no ids runs`, async () =>
        {
            const { stdout } = await occRun([command])
            assert.ok(stdout.trim().length > 0)
        })
    }

    test("every command in the help table is dispatchable", async () =>
    {
        const { stdout } = await occRun(["--help"])
        const listed = [...stdout.matchAll(/^ {2}occ (\w+)/gm)].map((m) => m[1])
        assert.ok(listed.includes("ls"))

        for (const command of listed.filter((c) => !["del", "resume"].includes(c)))
        {
            const { stdout: out } = await occRun([command, "aaaaaa"])
            assert.ok(out.trim().length > 0, `${command} printed nothing`)
        }
    })

    test("a title argument works end to end", async () =>
    {
        const { stdout } = await occRun(["ls", "ocls"])
        assert.match(stdout, /aaaaaa/)
        assert.match(stdout, /Coco - ocls/)
    })

    test("every read command accepts a title argument", async () =>
    {
        for (const command of READ_COMMANDS)
        {
            const { stdout } = await occRun([command, "ocls"])
            assert.match(stdout, /aaaaaa/, `${command} did not resolve a title`)
        }
    })
})

describe("cli help", () => {

    test("no arguments falls back to ls", async () =>
    {
        const { stdout } = await occRun([])
        const { stdout: listed } = await occRun(["ls"])
        assert.equal(stdout, listed)
        assert.doesNotMatch(stdout, /usage:/)
    })

    test("an empty argument is still a command lookup", async () =>
    {
        await assert.rejects(() => occRun([""]), rejectsWith(/unknown command/))
    })

    test("an unknown command fails with a message", async () =>
    {
        await assert.rejects(() => occRun(["frobnicate"]), rejectsWith(/unknown command "frobnicate"/))
    })
})

describe("cli del", () => {
    test("is dispatched and reaches its own guard", async () =>
    {
        await assert.rejects(() => occRun(["del"]), rejectsWith(/at least one session id/))
    })

    test("refuses without a terminal", async () =>
    {
        await assert.rejects(() => occRun(["del", "aaaaaa"]), rejectsWith(/needs a terminal/))
    })
})

describe("cli resume", () => {

    test("is dispatched and reaches its own guard", async () =>
    {
        await assert.rejects(() => occRun(["resume"]), rejectsWith(/exactly one session id/))
    })

    test("refuses without a terminal", async () =>
    {
        await assert.rejects(() => occRun(["resume", "aaaaaa"]), rejectsWith(/needs a terminal/))
    })
})
