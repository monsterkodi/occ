import { DatabaseSync } from "node:sqlite"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

export class OclsError extends Error {
  constructor(message) {
    super(message)
    this.name = "OclsError"
  }
}

const REQUIRED_COLUMNS = ["id", "title", "time_created", "time_updated"]

function probe(db, path) {
  const columns = new Set(
    db.prepare("SELECT name FROM pragma_table_info('session_v2')").all().map((r) => r.name),
  )

  if (columns.size === 0) {
    db.close()
    throw new OclsError(
      `unrecognized schema in ${path}: table session_v2 not found, opencode may have changed its storage format`,
    )
  }

  const missing = REQUIRED_COLUMNS.filter((c) => !columns.has(c))
  if (missing.length > 0) {
    db.close()
    throw new OclsError(
      `unrecognized schema in ${path}: session_v2 is missing ${missing.join(", ")}`,
    )
  }
}

export function resolveDbPath(env = process.env) {
  const base = env.XDG_DATA_HOME || join(homedir(), ".local", "share")
  return join(base, "opencode", "opencode.db")
}

function connect(path, options) {
  if (!existsSync(path)) {
    throw new OclsError(`no database at ${path}`)
  }

  let db
  try {
    db = new DatabaseSync(path, options)
  } catch (e) {
    throw new OclsError(`cannot open ${path}: ${e.message}`)
  }

  probe(db, path)
  return db
}

export function openDb(path) {
  return connect(path, { readOnly: true })
}

export function openWritable(path) {
  const db = connect(path, {})
  db.exec("PRAGMA foreign_keys = ON")
  return db
}
