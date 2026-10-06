import { OclsError } from "./db.js"

export { OclsError }

const SELECT = `
  SELECT
    s.id,
    s.title,
    s.time_created,
    s.time_updated,
    (
      SELECT count(*)
      FROM session_message m
      WHERE m.session_id = s.id
        AND m.type = 'user'
        AND coalesce(json_extract(m.data, '$.text'), '') <> ''
    ) AS turns
  FROM session_v2 s
`

const CHILD_FILTER = "s.parent_id IS NULL"

const ORDER = "ORDER BY s.time_updated ASC, s.time_created ASC, s.id ASC"

function normalize(prefix) {
  return prefix.startsWith("ses_") ? prefix.slice(4) : prefix
}

function likeEscape(text) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`)
}

function resolveOne(db, prefix) {
  const needle = likeEscape(normalize(prefix))
  const rows = db
    .prepare(
      `${SELECT}
       WHERE s.id LIKE 'ses_' || ? || '%' ESCAPE '\\' AND ${CHILD_FILTER}`,
    )
    .all(needle)

  if (rows.length === 0) {
    throw new OclsError(`no session matches "${prefix}"`)
  }

  if (rows.length > 1) {
    throw new OclsError(
      `prefix "${prefix}" matches ${rows.length} sessions, use 6 or more characters`,
    )
  }

  return rows[0]
}

export function listSessions(db, prefixes = []) {
  if (prefixes.length === 0) {
    return db.prepare(`${SELECT} WHERE ${CHILD_FILTER} ${ORDER}`).all()
  }

  const seen = new Set()
  const found = []
  for (const prefix of prefixes) {
    const row = resolveOne(db, prefix)
    if (!seen.has(row.id)) {
      seen.add(row.id)
      found.push(row)
    }
  }
  return found
}

const MESSAGE_SELECT = `
  SELECT type, data
  FROM session_message
  WHERE session_id = ?
  ORDER BY seq ASC
`

function joinText(parts) {
  if (!Array.isArray(parts)) return ""
  return parts
    .filter((p) => p && p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("\n\n")
}

function toTurn(row) {
  const data = JSON.parse(row.data)

  if (row.type === "user") {
    return {
      role: "user",
      agent: null,
      text: typeof data.text === "string" ? data.text : "",
    }
  }

  return {
    role: "agent",
    agent: data.agent ?? null,
    text: joinText(data.content),
  }
}

export function getSession(db, id) {
  const [row] = db.prepare(`${SELECT} WHERE s.id = ?`).all(id)

  if (!row) {
    throw new OclsError(`no session matches "${id}"`)
  }

  const messages = db
    .prepare(MESSAGE_SELECT)
    .all(id)
    .filter((m) => m.type === "user" || m.type === "assistant")
    .map(toTurn)

  return { ...row, messages }
}
