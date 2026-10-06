import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { renderBlocks } from "../src/render.js"
import { createStyle } from "../src/style.js"

const plain = createStyle(false)
const colored = createStyle(true)

const block = (kind, extra) => ({ kind, ...extra })

const markersOf = (blocks) =>
    renderBlocks(blocks, plain)
        .split("\n")
        .filter((l) => l.startsWith(">") || l === "…" || l.startsWith("$"))

const history = [
    block("turn", { role: "user", agent: null, text: "hi conny" }),
    block("turn", { role: "agent", agent: "build", text: "let me look" }),
    block("call", { name: "shell", agent: "build", command: "ls -la; hyprctl version" }),
    block("result", { name: "shell", text: "total 48", outputPath: null }),
    block("turn", { role: "agent", agent: "build", text: "found it" }),
]

describe("renderBlocks", () => {
    test("a tool block does not close the agent run", () =>
    {
        assert.equal(
            renderBlocks(history, plain),
            [
                "> user",
                "hi conny",
                "> agent build",
                "let me look",
                "$ shell",
                "ls -la; hyprctl version",
                "$ shell result",
                "total 48",
                "…",
                "found it",
            ].join("\n"),
        )
    })

    test("a tool marker starts with a dollar, a turn marker with an angle bracket", () =>
    {
        const lines = renderBlocks(history, plain).split("\n")
        for (const line of lines.filter((l) => /^[>$]/.test(l)))
        {
            const marker = line.split(" ")[0]
            if (marker === "$") continue
            assert.ok(marker.startsWith(">"), `tool marker ${marker}`)
        }
        assert.ok(lines.includes("> user"))
        assert.ok(lines.includes("> agent build"))
    })

    test("there is never an agent marker and an ellipsis on one turn", () =>
    {
        assert.deepEqual(markersOf(history), [
            "> user",
            "> agent build",
            "$ shell",
            "$ shell result",
            "…",
        ])
    })

    test("a user turn reopens the marker for the next agent turn", () =>
    {
        assert.deepEqual(
            markersOf([
                block("turn", { role: "agent", agent: "plan", text: "one" }),
                block("call", { name: "shell", agent: "plan", command: "true" }),
                block("result", { name: "shell", text: "ok", outputPath: null }),
                block("turn", { role: "user", agent: null, text: "thanks" }),
                block("turn", { role: "agent", agent: "plan", text: "two" }),
            ]),
            ["> agent plan", "$ shell", "$ shell result", "> user", "> agent plan"],
        )
    })

    test("a second agent turn continues with an ellipsis", () =>
    {
        assert.equal(
            renderBlocks(
                [
                    block("turn", { role: "agent", agent: "build", text: "checking" }),
                    block("turn", { role: "agent", agent: "build", text: "found it" }),
                    block("turn", { role: "agent", agent: "build", text: "so that is why" }),
                ],
                plain,
            ),
            "> agent build\nchecking\n…\nfound it\n…\nso that is why",
        )
    })

    test("the continuation marker is one character, no padding", () =>
    {
        const out = renderBlocks(
            [
                block("turn", { role: "agent", agent: "build", text: "one" }),
                block("turn", { role: "agent", agent: "build", text: "two" }),
            ],
            plain,
        )
        assert.equal(out.split("\n")[2], "…")
    })

    test("an empty agent turn neither renders nor breaks the run", () =>
    {
        const out = renderBlocks(
            [
                block("turn", { role: "agent", agent: "build", text: "one" }),
                block("turn", { role: "agent", agent: "build", text: "" }),
                block("turn", { role: "agent", agent: "build", text: "two" }),
            ],
            plain,
        )
        assert.equal(out, "> agent build\none\n…\ntwo")
    })

    test("empty text renders nothing", () =>
    {
        assert.equal(renderBlocks([block("turn", { role: "user", text: "   " })], plain), "")
        assert.equal(renderBlocks([], plain), "")
    })

    test("an agent turn without an agent field still gets a marker", () =>
    {
        assert.equal(
            renderBlocks([block("turn", { role: "agent", agent: null, text: "hi" })], plain),
            "> agent\nhi",
        )
    })
})

describe("renderBlocks tools", () => {
    test("a run opening with a tool call gets the agent marker first", () =>
    {
        assert.equal(
            renderBlocks(
                [
                    block("turn", { role: "user", agent: null, text: "do the thing" }),
                    block("call", { name: "bash", agent: "build", command: "false" }),
                    block("result", { name: "bash", text: "boom", outputPath: null }),
                    block("exit", { name: "bash", code: 42 }),
                    block("turn", { role: "agent", agent: "build", text: "it failed" }),
                ],
                plain,
            ),
            [
                "> user",
                "do the thing",
                "> agent build",
                "$ bash",
                "false",
                "$ bash result",
                "boom",
                "$ bash exit 42",
                "…",
                "it failed",
            ].join("\n"),
        )
    })

    test("only one agent marker in a run that opens with tool calls", () =>
    {
        assert.deepEqual(
            markersOf([
                block("turn", { role: "user", agent: null, text: "go" }),
                block("call", { name: "bash", agent: "build", command: "one" }),
                block("result", { name: "bash", text: "1", outputPath: null }),
                block("call", { name: "bash", agent: "build", command: "two" }),
                block("result", { name: "bash", text: "2", outputPath: null }),
                block("turn", { role: "agent", agent: "build", text: "done" }),
            ]),
            ["> user", "> agent build", "$ bash", "$ bash result", "$ bash", "$ bash result", "…"],
        )
    })

    test("a run opening with a tool call and no agent field", () =>
    {
        assert.equal(
            renderBlocks([block("call", { name: "grep", agent: null, command: "x" })], plain),
            "> agent\n$ grep\nx",
        )
    })

    test("a result marker names the tool it came from", () =>
    {
        assert.equal(
            renderBlocks(
                [
                    block("call", { name: "edit", agent: "build", command: "old" }),
                    block("result", { name: "edit", text: "written", outputPath: null }),
                ],
                plain,
            ),
            "> agent build\n$ edit\nold\n$ edit result\nwritten",
        )
    })

    test("an exit marker names the tool and the code", () =>
    {
        assert.equal(
            renderBlocks(
                [
                    block("call", { name: "edit", agent: "build", command: "old" }),
                    block("exit", { name: "edit", code: 1 }),
                ],
                plain,
            ),
            "> agent build\n$ edit\nold\n$ edit exit 1",
        )
    })

    test("a zero exit gets no exit marker", () =>
    {
        assert.equal(
            renderBlocks(
                [
                    block("call", { name: "bash", agent: "build", command: "true" }),
                    block("result", { name: "bash", text: "", outputPath: null }),
                ],
                plain,
            ),
            "> agent build\n$ bash\ntrue",
        )
    })

    test("call and result text is verbatim and unindented", () =>
    {
        assert.equal(
            renderBlocks(
                [
                    block("call", { name: "shell", agent: "build", command: "line one\n  indented\n\nline four" }),
                    block("result", { name: "shell", text: "  leading space\ntrailing   ", outputPath: null }),
                ],
                plain,
            ),
            "> agent build\n$ shell\nline one\n  indented\n\nline four\n$ shell result\n  leading space\ntrailing",
        )
    })

    test("a truncated result points at the full output", () =>
    {
        assert.equal(
            renderBlocks(
                [block("result", { name: "read", text: "partial", outputPath: "/tmp/tool_abc" })],
                plain,
            ),
            "$ read result\npartial\n… full output at /tmp/tool_abc",
        )
    })

    test("a call with no following result still renders the call", () =>
    {
        assert.equal(
            renderBlocks([block("call", { name: "grep", agent: "build", command: "grep x" })], plain),
            "> agent build\n$ grep\ngrep x",
        )
    })

    test("the call marker shows the tool name", () =>
    {
        assert.ok(
            renderBlocks([block("call", { name: "webfetch", agent: "build", command: "GET /x" })], plain)
                .includes("$ webfetch\n"),
        )
    })
})

describe("renderBlocks colors", () => {
    test("colors leave the visible text untouched", () =>
    {
        assert.equal(
            renderBlocks(history, colored).replace(/\x1b\[[0-9;]*m/g, ""),
            renderBlocks(history, plain),
        )
    })

    test("a call and its result share one marker color, distinct from turns", () =>
    {
        const markers = renderBlocks(history, colored)
            .split("\n")
            .filter((l) => /^\x1b\[/.test(l))
        const codes = (line) => (line.match(/\x1b\[[0-9;]*m/g) ?? []).slice(0, 1).join()
        const [user, agent, call, result] = markers

        assert.equal(codes(call), codes(result))
        assert.notEqual(codes(call), codes(agent))
        assert.notEqual(codes(call), codes(user))
    })

    test("user and agent markers are colored differently", () =>
    {
        const lines = renderBlocks(history, colored).split("\n")
        const [user, agent, call, result] = [lines[0], lines[2], lines[4], lines[6]]
        const codes = (line) => (line.match(/\x1b\[[0-9;]*m/g) ?? []).slice(0, 1).join()

        assert.notEqual(codes(user), codes(agent))
        assert.ok(user.includes("\x1b["))
        assert.ok(agent.includes("\x1b["))
        assert.ok(call.includes("\x1b["))
        assert.ok(result.includes("\x1b["))
    })
})
