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

const MESSAGE_DDL = `
  CREATE TABLE session_message (
    id text PRIMARY KEY,
    session_id text NOT NULL,
    type text NOT NULL,
    seq integer NOT NULL,
    data text NOT NULL
  )
`

function msg(id, sessionId, type, seq, payload) {
  return [id, sessionId, type, seq, JSON.stringify(payload)]
}

function seed(db) {
  db.exec(SESSION_DDL)
  db.exec(MESSAGE_DDL)

  const insertSession = db.prepare(
    "INSERT INTO session_v2 (id, project_id, parent_id, title, slug, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  )
  const insertMessage = db.prepare(
    "INSERT INTO session_message (id, session_id, type, seq, data) VALUES (?, ?, ?, ?, ?)",
  )

  insertSession.run("ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "proj1", null, "First session", "witty-knight", "/home/kodi/a/coco", BASE, BASE + 60_000)
  insertSession.run("ses_bbbbbbbbbbbbbbbbbbbbbbb2", "proj1", null, null, "happy-meadow", "/home/kodi/.config", BASE + 120_000, BASE + 180_000)
  insertSession.run("ses_ccccccccccccccccccccccc3", "proj1", null, "A rather long session title that will certainly need to be cropped at the right edge", "brave-otter", "/home/kodi/s/ocls", BASE + 240_000, BASE + 300_000)
  insertSession.run("ses_ddddddddddddddddddddddd4", "proj1", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "Child session", "quiet-fox", "/home/kodi/a/coco", BASE + 360_000, BASE + 420_000)

  insertMessage.run(...msg("m1", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "user", 1, { text: "hello" }))
  insertMessage.run(...msg("m2", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "user", 2, { text: "again" }))
  insertMessage.run(...msg("m3", "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1", "synthetic", 3, { text: "system note" }))

  insertMessage.run(...msg("m4", "ses_bbbbbbbbbbbbbbbbbbbbbbb2", "idle", 1, { outcome: "prompt-input" }))
  insertMessage.run(...msg("m5", "ses_bbbbbbbbbbbbbbbbbbbbbbb2", "user", 2, { text: "" }))

  insertMessage.run(...msg("m6", "ses_ccccccccccccccccccccccc3", "user", 1, { text: "one" }))
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
