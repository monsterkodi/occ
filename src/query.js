import { OclsError } from "./db.js"

export { OclsError }

const SELECT = `
  SELECT
    s.id,
    s.title,
    s.directory,
    s.time_created,
    s.time_updated,
    coalesce(
      (
        SELECT max(m.time_created)
        FROM session_message m
        WHERE m.session_id = s.id
      ),
      s.time_updated
    ) AS time_last,
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

const ORDER = "ORDER BY time_last ASC, s.time_created ASC, s.id ASC"

const MESSAGE_SELECT = `
  SELECT seq, type, data
  FROM session_message
  WHERE session_id = ?
  ORDER BY seq ASC
`

function normalize(prefix)
{
    return prefix.startsWith("ses_") ? prefix.slice(4) : prefix
}

function likeEscape(text)
{
    return text.replace(/[\\%_]/g, (c) => `\\${c}`)
}

const ID_MATCH = "s.id LIKE 'ses_' || ? || '%' ESCAPE '\\'"

const TITLE_MATCH = "lower(coalesce(s.title, '')) LIKE '%' || ? || '%' ESCAPE '\\'"

function resolveOne(db, prefix)
{
    const needle = likeEscape(normalize(prefix))

    const byId = db
        .prepare(`${SELECT} WHERE ${ID_MATCH} AND ${CHILD_FILTER}`)
        .all(needle)

    if (byId.length > 1)
    {
        throw new OclsError(
            `prefix "${prefix}" matches ${byId.length} sessions, use 6 or more characters`,
        )
    }

    if (byId.length === 1)
    {
        return byId
    }

    const byTitle = db
        .prepare(`${SELECT} WHERE ${TITLE_MATCH} AND ${CHILD_FILTER} ${ORDER}`)
        .all(needle)

    if (byTitle.length === 0)
    {
        throw new OclsError(`no session matches "${prefix}"`)
    }

    return byTitle
}

function commandOf(input)
{
    if (typeof input?.command === "string") return input.command
    return JSON.stringify(input ?? null, null, 2)
}

function resultOf(state)
{
    const error = state?.error?.message
    if (typeof error === "string") return error

    const content = state?.content
    if (!Array.isArray(content)) return ""

    return content
        .filter((c) => c && c.type === "text" && typeof c.text === "string")
        .map((c) => c.text)
        .join("\n")
}

function toBlocks(data, type, message, blocks)
{
    if (type === "user")
    {
        const text = typeof data.text === "string" ? data.text : ""
        if (text !== "")
        {
            blocks.push({ kind: "turn", role: "user", agent: null, text, message })
        }
        return
    }

    const agent = data.agent ?? null
    const content = Array.isArray(data.content) ? data.content : []
    let text = ""

    const flush = () =>
    {
        if (text === "") return
        blocks.push({ kind: "turn", role: "agent", agent, text, message })
        text = ""
    }

    for (const part of content)
    {
        if (!part || typeof part !== "object") continue

        if (part.type === "text" && typeof part.text === "string")
        {
            text = text === "" ? part.text : `${text}\n\n${part.text}`
            continue
        }

        if (part.type !== "tool") continue

        flush()
        const name = part.name ?? "tool"
        blocks.push({
            kind: "call",
            name,
            agent,
            command: commandOf(part.state?.input),
        })

        const result = resultOf(part.state)
        if (result !== "")
        {
            blocks.push({
                kind: "result",
                name,
                text: result,
                outputPath: part.state?.metadata?.outputPath ?? null,
            })
        }

        const code = part.state?.metadata?.exit
        if (typeof code === "number" && code !== 0)
        {
            blocks.push({ kind: "exit", name, code })
        }
    }

    flush()
}

export function listSessions(db, prefixes = [])
{
    if (prefixes.length === 0)
    {
        return db.prepare(`${SELECT} WHERE ${CHILD_FILTER} ${ORDER}`).all()
    }

    const seen = new Set()
    const found = []
    for (const prefix of prefixes)
    {
        for (const row of resolveOne(db, prefix))
        {
            if (!seen.has(row.id))
            {
                seen.add(row.id)
                found.push(row)
            }
        }
    }
    return found
}

export function getSession(db, id)
{
    const [row] = db.prepare(`${SELECT} WHERE s.id = ?`).all(id)

    if (!row)
    {
        throw new OclsError(`no session matches "${id}"`)
    }

    const blocks = []
    for (const message of db.prepare(MESSAGE_SELECT).all(id))
    {
        toBlocks(JSON.parse(message.data), message.type, message.seq, blocks)
    }

    return { row, blocks }
}

export function deleteSessions(db, ids)
{
    const remove = db.prepare("DELETE FROM session_v2 WHERE id = ?")
    db.exec("BEGIN")
    try
    {
        for (const id of ids) remove.run(id)
        db.exec("COMMIT")
    }
    catch (e)
    {
        db.exec("ROLLBACK")
        throw e
    }
}
