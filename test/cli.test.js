import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { makeDataHome } from "./fixtures/build.js"

const run = promisify(execFile)
const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const ocls = join(root, "ocls.js")

const { home } = makeDataHome()

function oclsRun(args, env = {}) {
  return run(process.execPath, [ocls, ...args], {
    env: { ...process.env, XDG_DATA_HOME: home, NO_COLOR: "1", ...env },
  })
}

const READ_COMMANDS = ["ls", "cat", "log", "shell"]

describe("cli dispatch", () => {
  for (const command of READ_COMMANDS) {
    test(`${command} runs and prints something`, async () => {
      const { stdout } = await oclsRun([command, "aaaaaa"])
      assert.match(stdout, /aaaaaa/)
      assert.ok(stdout.trim().length > 0)
    })

    test(`${command} with no ids runs`, async () => {
      const { stdout } = await oclsRun([command])
      assert.ok(stdout.trim().length > 0)
    })
  }

  test("every command in the table is dispatchable", async () => {
    const { stdout } = await oclsRun(["--help"])
    const listed = [...stdout.matchAll(/^ {2}ocls (\w+)/gm)].map((m) => m[1])
    assert.ok(listed.includes("ls"))
    for (const command of listed) {
      if (command === "del") continue
      const { stdout: out } = await oclsRun([command, "aaaaaa"])
      assert.ok(out.trim().length > 0, `${command} printed nothing`)
    }
  })

  test("del is listed in the help text", async () => {
    const { stdout } = await oclsRun(["--help"])
    assert.match(stdout, /ocls del id \[id\.\.\.\]/)
  })

  test("help exits zero", async () => {
    const { stdout } = await oclsRun(["--help"])
    assert.match(stdout, /session table columns/)
  })

  test("no arguments prints help", async () => {
    const { stdout } = await oclsRun([])
    assert.match(stdout, /usage:/)
  })

  test("an unknown command fails with a message", async () => {
    await assert.rejects(() => oclsRun(["frobnicate"]), (e) => {
      assert.equal(e.code, 1)
      assert.match(e.stderr, /unknown command "frobnicate"/)
      return true
    })
  })

  test("del is dispatched and reaches its own guard", async () => {
    await assert.rejects(
      () => oclsRun(["del"]),
      (e) => {
        assert.equal(e.code, 1)
        assert.match(e.stderr, /at least one session id/)
        return true
      },
    )
  })

  test("del refuses without a terminal", async () => {
    await assert.rejects(
      () => oclsRun(["del", "aaaaaa"]),
      (e) => {
        assert.equal(e.code, 1)
        assert.match(e.stderr, /needs a terminal/)
        return true
      },
    )
  })
})
