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

const ofKind = (id, kind) => blocks(id).filter((b) => b.kind === kind)

describe("getSession order", () => {
    test("walks messages and parts in order", () =>
    {
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

    test("consecutive text parts in one message join with a blank line", () =>
    {
        const turn = blocks(A).find((b) => b.text === "first bit\n\nsecond bit")
        assert.equal(turn.kind, "turn")
    })
})

describe("getSession message types", () => {
    test("reasoning, synthetic and idle never produce blocks", () =>
    {
        const texts = blocks(A).map((b) => b.text ?? "").join("\n")
        assert.ok(!texts.includes("thinking about the greeting"))
        assert.ok(!texts.includes("only thinking"))
        assert.ok(!texts.includes("system note"))
    })

    test("turn blocks carry the role and agent field", () =>
    {
        const turns = ofKind(A, "turn")
        assert.equal(turns[0].role, "user")
        assert.equal(turns[0].agent, null)
        assert.equal(turns[1].role, "agent")
        assert.equal(turns[1].agent, "plan")
        assert.equal(turns[4].agent, "build")
        assert.equal(turns[5].agent, null)
    })

    test("call blocks carry the agent of the message they came from", () =>
    {
        assert.equal(ofKind(C, "call")[0].agent, "build")
    })

    test("unknown session id is an error", () =>
    {
        assert.throws(() => getSession(db, "nope"), /no session/i)
    })

    test("the row is the same one listSessions returns", () =>
    {
        const [fromList] = listSessions(db, ["aaaaaa"])
        const { row } = getSession(db, A)

        assert.equal(row.id, fromList.id)
        assert.equal(row.title, fromList.title)
        assert.equal(row.turns, fromList.turns)
        assert.equal(row.time_created, BASE)
    })
})

describe("getSession tool blocks", () => {
    test("a call block carries the tool name and its input command", () =>
    {
        const call = ofKind(A, "call")[0]
        assert.equal(call.name, "shell")
        assert.equal(call.command, "ls -la; echo ---; hyprctl version")
    })

    test("a tool with empty output produces no result block", () =>
    {
        assert.equal(ofKind(A, "call").length, 5)
        assert.equal(ofKind(A, "result").length, 3)
    })

    test("an errored tool puts the error message where the result would be", () =>
    {
        const texts = ofKind(A, "result").map((b) => b.text)
        assert.ok(texts.includes("StatusCode: non 2xx status code (404)"))
    })

    test("a running tool produces no result block", () =>
    {
        const names = ofKind(A, "call").map((b) => b.name)
        assert.ok(names.includes("grep"))
        assert.equal(ofKind(A, "result").length, 3)
    })

    test("every call block carries its tool name", () =>
    {
        assert.deepEqual(ofKind(C, "call").map((b) => b.name), ["shell", "shell", "shell"])
    })

    test("a nonzero exit produces an exit block naming the tool", () =>
    {
        assert.deepEqual(ofKind(C, "exit"), [{ kind: "exit", name: "shell", code: 42 }])
    })

    test("a zero exit produces no exit block", () =>
    {
        assert.equal(ofKind(A, "exit").length, 0)
    })

    test("a truncated result carries its full output path", () =>
    {
        const truncated = ofKind(A, "result").find((b) => b.outputPath)
        assert.equal(
            truncated.outputPath,
            "/home/kodi/.local/share/opencode/tool-output/tool_abc",
        )
    })

    test("a non-truncated result has no output path", () =>
    {
        const full = ofKind(A, "result").find((b) => b.text.startsWith("total 48"))
        assert.equal(full.outputPath, null)
    })
})
