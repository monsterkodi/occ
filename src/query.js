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
