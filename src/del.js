import { listSessions, deleteSessions } from "./query.js"
import { renderSession } from "./render.js"
import { OclsError } from "./db.js"

const WARNING = " DELETE SESSIONS "

const AFFIRMATIVE = new Set(["y", "yes"])

export function del({ db, prefixes = [], width = 80, style, io })
{
    if (prefixes.length === 0)
    {
        throw new OclsError("del needs at least one session id")
    }

    if (!io.interactive)
    {
        throw new OclsError("del needs a terminal to confirm in")
    }

    const sessions = listSessions(db, prefixes)
    const table = sessions
        .map((session) => renderSession(session, width, style))
        .join("\n")

    io.write(`${style.del.warning(WARNING)}\n\n${table}\n\n`)
    io.write(`${style.del.question(" ARE YOU SURE? (yN) ")}`)

    const answer = (io.readAnswer() ?? "").trim().toLowerCase()
    if (!AFFIRMATIVE.has(answer))
    {
        io.write("\nnothing deleted\n")
        return { deleted: [] }
    }

    const ids = sessions.map((session) => session.id)
    deleteSessions(db, ids)
    io.write(`\ndeleted ${ids.length} session(s)\n`)
    return { deleted: ids }
}
