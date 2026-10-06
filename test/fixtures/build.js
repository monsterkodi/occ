import { DatabaseSync } from "node:sqlite"
import { mkdirSync, renameSync, rmSync } from "node:fs"
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

export function countRows(db, sessionId) {
  return Object.fromEntries(
    CHILD_TABLES.map((table) => [
      table,
      db.prepare(`SELECT count(*) AS c FROM ${table} WHERE session_id = ?`).get(sessionId).c,
    ]),
  )
}

function msg(id, sessionId, type, seq, payload) {
  return [id, sessionId, type, seq, BASE + seq * 1000, BASE + seq * 1000, JSON.stringify(payload)]
}

function text(t) {
  return { type: "text", text: t }
}

function reasoning(t) {
  return { type: "reasoning", text: t }
}

function tool(name, input, opts = {}) {
  const state = { status: opts.status ?? "completed", input }
  if (opts.error !== undefined) {
    state.error = { type: "unknown", message: opts.error }
  } else if (opts.result !== undefined) {
    state.content = [{ type: "text", text: opts.result }]
  }
  state.metadata = { exit: opts.exit ?? 0, ...opts.metadata }
  return { type: "tool", id: `call_${name}`, name, state }
}

function seed(db) {
  db.exec(SESSION_DDL)
  db.exec(CHILD_DDL)

  const insertSession = db.prepare(
    "INSERT INTO session_v2 (id, project_id, parent_id, title, slug, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  )
  const insertMessage = db.prepare(
    "INSERT INTO session_message (id, session_id, type, seq, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )

  insertSession.run("ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "proj1", null, "First session", "witty-knight", "/home/kodi/a/coco", BASE, BASE + 60_000)
  insertSession.run("ses_bbbbbbbbbbbbbbbbbbbbbbb2", "proj1", null, null, "happy-meadow", "/home/kodi/.config", BASE + 120_000, BASE + 180_000)
  insertSession.run("ses_ccccccccccccccccccccccc3", "proj1", null, "A rather long session title that will certainly need to be cropped at the right edge", "brave-otter", "/home/kodi/s/ocls", BASE + 240_000, BASE + 300_000)
  insertSession.run("ses_ddddddddddddddddddddddd4", "proj1", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "Child session", "quiet-fox", "/home/kodi/a/coco", BASE + 360_000, BASE + 420_000)

  insertMessage.run(...msg("m1", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "user", 1, { text: "hello" }))
  insertMessage.run(...msg("m2", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "assistant", 2, {
    agent: "plan",
    content: [
      reasoning("thinking about the greeting"),
      text("hi there"),
      tool("shell", { command: "ls -la; echo ---; hyprctl version" }, { result: "total 48\n---\nHyprland 0.56.2" }),
      text("done listing"),
    ],
  }))
  insertMessage.run(...msg("m3", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "user", 3, { text: "again" }))
  insertMessage.run(...msg("m4", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "assistant", 4, {
    agent: "build",
    content: [text("first bit"), text("second bit")],
  }))
  insertMessage.run(...msg("m5", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "assistant", 5, {
    content: [text("no agent field")],
  }))
  insertMessage.run(...msg("m6", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "assistant", 6, {
    agent: "plan",
    content: [
      reasoning("only thinking"),
      tool("shell", { command: "true" }, { result: "" }),
      tool("webfetch", { url: "https://example.invalid" }, { error: "StatusCode: non 2xx status code (404)" }),
      tool("grep", { pattern: "needle" }, { status: "running" }),
      tool("read", { path: "/home/kodi/s/ocls/spec.txt" }, {
        result: "name: ocls\n",
        metadata: { truncated: 1, outputPath: "/home/kodi/.local/share/opencode/tool-output/tool_abc" },
      }),
    ],
  }))
  insertMessage.run(...msg("m7", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "synthetic", 7, { text: "system note" }))

  insertMessage.run(...msg("m8", "ses_bbbbbbbbbbbbbbbbbbbbbbb2", "idle", 1, { outcome: "prompt-input" }))
  insertMessage.run(...msg("m9", "ses_bbbbbbbbbbbbbbbbbbbbbbb2", "user", 2, { text: "" }))

  insertMessage.run(...msg("m10", "ses_ccccccccccccccccccccccc3", "user", 1, { text: "one" }))
  insertMessage.run(...msg("m11", "ses_ccccccccccccccccccccccc3", "assistant", 2, {
    agent: "build",
    content: [tool("shell", { command: "echo hi" }, { result: "hi\n" })],
  }))
  insertMessage.run(...msg("m12", "ses_ccccccccccccccccccccccc3", "assistant", 3, {
    agent: "build",
    content: [
      tool("shell", { command: "cat > x <<'EOF'\nline\nEOF" }, { result: "" }),
      text("after the tool"),
    ],
  }))
  insertMessage.run(...msg("m13", "ses_ccccccccccccccccccccccc3", "assistant", 4, {
    agent: "build",
    content: [tool("shell", { command: "false" }, { result: "boom", exit: 42 })],
  }))

  seedChildren(db)
}

function seedChildren(db) {
  const a = "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"
  const c = "ses_ccccccccccccccccccccccc3"

  db.prepare(
    "INSERT INTO session_pending (id, session_id, type, data, delivery, admitted_seq, time_created) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run("p1", a, "compaction", "{}", "direct", 1, BASE)

  db.prepare(
    "INSERT INTO session_inbox (id, session_id, type, payload, delivery, enqueued_seq, time_created) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run("i1", a, "note", "{}", "direct", 1, BASE)

  db.prepare(
    "INSERT INTO instruction_entry (session_id, key, value, removed, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(a, "reply", "short", 0, BASE, BASE)

  db.prepare(
    "INSERT INTO instruction_state (session_id, epoch_start, through_seq, initial_values, current_values) VALUES (?, ?, ?, ?, ?)",
  ).run(a, 0, 7, "{}", "{}")

  db.prepare(
    "INSERT INTO session_pending (id, session_id, type, data, delivery, admitted_seq, time_created) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run("p2", c, "compaction", "{}", "direct", 2, BASE)

  db.prepare(
    "INSERT INTO session_inbox (id, session_id, type, payload, delivery, enqueued_seq, time_created) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run("i2", c, "note", "{}", "direct", 2, BASE)

  db.prepare(
    "INSERT INTO instruction_entry (session_id, key, value, removed, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(c, "reply", "terse", 0, BASE, BASE)

  db.prepare(
    "INSERT INTO instruction_state (session_id, epoch_start, through_seq, initial_values, current_values) VALUES (?, ?, ?, ?, ?)",
  ).run(c, 0, 4, "{}", "{}")
}

function build(name, fill) {
  const dir = join(tmpdir(), "ocls-fixtures", String(process.pid))
  mkdirSync(dir, { recursive: true })
  const final = join(dir, name)
  const staging = `${final}.building`
  rmSync(staging, { force: true })
  const db = new DatabaseSync(staging)
  try {
    fill(db)
  } finally {
    db.close()
  }
  renameSync(staging, final)
  return final
}

export function buildTestDb() {
  return build("test.db", seed)
}

export function buildBadSchemaDb() {
  return build("bad-schema.db", (db) => {
    db.exec("CREATE TABLE session_v3 (id text PRIMARY KEY)")
  })
}

export function buildMissingColumnDb() {
  return build("missing-column.db", (db) => {
    db.exec(
      "CREATE TABLE session_v2 (id text PRIMARY KEY, title text, time_created integer NOT NULL)",
    )
  })
}

let cached = null

export function fixtures() {
  if (!cached) {
    cached = {
      DB_PATH: buildTestDb(),
      BAD_SCHEMA_DB_PATH: buildBadSchemaDb(),
      MISSING_COLUMN_DB_PATH: buildMissingColumnDb(),
    }
  }
  return cached
}
