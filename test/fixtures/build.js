import { DatabaseSync } from "node:sqlite"
import { copyFileSync, mkdirSync, renameSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))

export const BASE = 1791283494422

const SESSION_DDL = `
  CREATE TABLE session_v2 (
    id text PRIMARY KEY,
    project_id text NOT NULL,
    parent_id text,
    title text,
    slug text NOT NULL,
    directory text NOT NULL,
    time_created integer NOT NULL,
    time_updated integer NOT NULL
  )
`

const CHILD_DDL = `
  CREATE TABLE session_message (
    id text PRIMARY KEY,
    session_id text NOT NULL,
    type text NOT NULL,
    seq integer NOT NULL,
    time_created integer NOT NULL,
    time_updated integer NOT NULL,
    data text NOT NULL,
    FOREIGN KEY (session_id) REFERENCES session_v2(id) ON DELETE CASCADE
  );

  CREATE TABLE session_pending (
    id text PRIMARY KEY,
    session_id text NOT NULL,
    type text NOT NULL,
    data text NOT NULL,
    delivery text NOT NULL,
    admitted_seq integer NOT NULL,
    time_created integer NOT NULL,
    FOREIGN KEY (session_id) REFERENCES session_v2(id) ON DELETE CASCADE
  );

  CREATE TABLE session_inbox (
    id text PRIMARY KEY,
    session_id text NOT NULL,
    type text NOT NULL,
    payload text NOT NULL,
    delivery text NOT NULL,
    enqueued_seq integer NOT NULL,
    time_created integer NOT NULL,
    FOREIGN KEY (session_id) REFERENCES session_v2(id) ON DELETE CASCADE
  );

  CREATE TABLE instruction_entry (
    session_id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    removed integer NOT NULL DEFAULT 0,
    time_created integer NOT NULL,
    time_updated integer NOT NULL,
    PRIMARY KEY (session_id, key),
    FOREIGN KEY (session_id) REFERENCES session_v2(id) ON DELETE CASCADE
  );

  CREATE TABLE instruction_state (
    session_id text PRIMARY KEY,
    epoch_start integer NOT NULL,
    through_seq integer NOT NULL,
    initial_values text NOT NULL,
    current_values text NOT NULL,
    FOREIGN KEY (session_id) REFERENCES session_v2(id) ON DELETE CASCADE
  );
`

const CHILD_TABLES = [
    "session_message",
    "session_pending",
    "session_inbox",
    "instruction_entry",
    "instruction_state",
]

const A = "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"
const C = "ses_ccccccccccccccccccccccc3"

export function countRows(db, sessionId)
{
    return Object.fromEntries(
        CHILD_TABLES.map((table) => [
            table,
            db.prepare(`SELECT count(*) AS c FROM ${table} WHERE session_id = ?`).get(sessionId).c,
        ]),
    )
}

function msg(id, sessionId, type, seq, payload)
{
    const at = BASE + seq * 1000
    return [id, sessionId, type, seq, at, at, JSON.stringify(payload)]
}

function text(t)
{
    return { type: "text", text: t }
}

function reasoning(t)
{
    return { type: "reasoning", text: t }
}

function tool(name, input, opts = {})
{
    const state = { status: opts.status ?? "completed", input }

    if (opts.error !== undefined)
    {
        state.error = { type: "unknown", message: opts.error }
    }
    else if (opts.result !== undefined)
    {
        state.content = [{ type: "text", text: opts.result }]
    }

    state.metadata = { exit: opts.exit ?? 0, ...opts.metadata }
    return { type: "tool", id: `call_${name}`, name, state }
}

function seedSessions(db)
{
    const insert = db.prepare(
        "INSERT INTO session_v2 (id, project_id, parent_id, title, slug, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )

    insert.run(A, "proj1", null, "Coco - ocls", "witty-knight", "/home/kodi/a/coco", BASE, BASE + 60_000)
    insert.run("ses_bbbbbbbbbbbbbbbbbbbbbbb2", "proj1", null, null, "happy-meadow", "/home/kodi/.config", BASE + 120_000, BASE + 180_000)
    insert.run(C, "proj1", null, "Conny - hyprsession", "brave-otter", "/home/kodi/s/occ", BASE + 240_000, BASE + 300_000)
    insert.run("ses_ddddddddddddddddddddddd4", "proj1", A, "Bert - child", "quiet-fox", "/home/kodi/a/coco", BASE + 360_000, BASE + 420_000)
}

function seedMessages(db)
{
    const insert = db.prepare(
        "INSERT INTO session_message (id, session_id, type, seq, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )

    insert.run(...msg("m1", A, "user", 1, { text: "hello" }))

    insert.run(...msg("m2", A, "assistant", 2, {
        agent: "plan",
        content: [
            reasoning("thinking about the greeting"),
            text("hi there"),
            tool("shell", { command: "ls -la; echo ---; hyprctl version" }, { result: "total 48\n---\nHyprland 0.56.2" }),
            text("done listing"),
        ],
    }))

    insert.run(...msg("m3", A, "user", 3, { text: "again" }))

    insert.run(...msg("m4", A, "assistant", 4, {
        agent: "build",
        content: [text("first bit"), text("second bit")],
    }))

    insert.run(...msg("m5", A, "assistant", 5, {
        content: [text("no agent field")],
    }))

    insert.run(...msg("m6", A, "assistant", 6, {
        agent: "plan",
        content: [
            reasoning("only thinking"),
            tool("shell", { command: "true" }, { result: "" }),
            tool("webfetch", { url: "https://example.invalid" }, { error: "StatusCode: non 2xx status code (404)" }),
            tool("grep", { pattern: "needle" }, { status: "running" }),
            tool("read", { path: "/home/kodi/s/occ/spec.txt" }, {
                result: "name: occ\n",
                metadata: { truncated: 1, outputPath: "/home/kodi/.local/share/opencode/tool-output/tool_abc" },
            }),
        ],
    }))

    insert.run(...msg("m7", A, "synthetic", 7, { text: "system note" }))
    insert.run(...msg("m8", "ses_bbbbbbbbbbbbbbbbbbbbbbb2", "idle", 1, { outcome: "prompt-input" }))
    insert.run(...msg("m9", "ses_bbbbbbbbbbbbbbbbbbbbbbb2", "user", 2, { text: "" }))

    insert.run(...msg("m10", C, "user", 1, { text: "one" }))

    insert.run(...msg("m11", C, "assistant", 2, {
        agent: "build",
        content: [tool("shell", { command: "echo hi" }, { result: "hi\n" })],
    }))

    insert.run(...msg("m12", C, "assistant", 3, {
        agent: "build",
        content: [
            tool("shell", { command: "cat > x <<'EOF'\nline\nEOF" }, { result: "" }),
            text("after the tool"),
        ],
    }))

    insert.run(...msg("m13", C, "assistant", 4, {
        agent: "build",
        content: [tool("shell", { command: "false" }, { result: "boom", exit: 42 })],
    }))
}

function seedChildren(db)
{
    const pending = db.prepare(
        "INSERT INTO session_pending (id, session_id, type, data, delivery, admitted_seq, time_created) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    const inbox = db.prepare(
        "INSERT INTO session_inbox (id, session_id, type, payload, delivery, enqueued_seq, time_created) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    const entry = db.prepare(
        "INSERT INTO instruction_entry (session_id, key, value, removed, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?)",
    )
    const state = db.prepare(
        "INSERT INTO instruction_state (session_id, epoch_start, through_seq, initial_values, current_values) VALUES (?, ?, ?, ?, ?)",
    )

    pending.run("p1", A, "compaction", "{}", "direct", 1, BASE)
    inbox.run("i1", A, "note", "{}", "direct", 1, BASE)
    entry.run(A, "reply", "short", 0, BASE, BASE)
    state.run(A, 0, 7, "{}", "{}")

    pending.run("p2", C, "compaction", "{}", "direct", 2, BASE)
    inbox.run("i2", C, "note", "{}", "direct", 2, BASE)
    entry.run(C, "reply", "terse", 0, BASE, BASE)
    state.run(C, 0, 4, "{}", "{}")
}

function seed(db)
{
    db.exec(SESSION_DDL)
    db.exec(CHILD_DDL)
    seedSessions(db)
    seedMessages(db)
    seedChildren(db)
}

function build(name, fill)
{
    const dir = join(tmpdir(), "occ-fixtures", String(process.pid))
    mkdirSync(dir, { recursive: true })

    const final = join(dir, name)
    const staging = `${final}.building`
    rmSync(staging, { force: true })

    const db = new DatabaseSync(staging)
    try
    {
        fill(db)
    }
    finally
    {
        db.close()
    }

    renameSync(staging, final)
    return final
}

export function buildTestDb()
{
    return build("test.db", seed)
}

export function buildBadSchemaDb()
{
    return build("bad-schema.db", (db) =>
    {
        db.exec("CREATE TABLE session_v3 (id text PRIMARY KEY)")
    })
}

export function buildMissingColumnDb()
{
    return build("missing-column.db", (db) =>
    {
        db.exec(
            "CREATE TABLE session_v2 (id text PRIMARY KEY, title text, time_created integer NOT NULL)",
        )
    })
}

export function makeDataHome()
{
    const source = buildTestDb()
    const home = join(tmpdir(), "occ-data-home", String(process.pid))
    const target = join(home, "opencode", "opencode.db")

    mkdirSync(join(home, "opencode"), { recursive: true })
    copyFileSync(source, target)
    return { home, dbPath: target }
}

let cached = null

export function fixtures()
{
    if (cached === null)
    {
        cached = {
            DB_PATH: buildTestDb(),
            BAD_SCHEMA_DB_PATH: buildBadSchemaDb(),
            MISSING_COLUMN_DB_PATH: buildMissingColumnDb(),
        }
    }

    return cached
}
