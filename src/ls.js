import { listSessions } from "./query.js"
import { renderSession, dayKey } from "./render.js"

function renderRows(sessions, width, style, groupByDate)
{
    let previous = null

    return sessions
        .map((session) =>
        {
            const day = dayKey(session.time_last ?? session.time_updated)
            const repeatDate = groupByDate && day === previous
            previous = day
            return renderSession(session, width, style, { repeatDate })
        })
        .join("\n")
}

export function ls({ db, prefixes = [], width = 80, style })
{
    // the date column only repeats across rows when the listing is the whole
    // table; with arguments the rows come back in the order they were named
    const groupByDate = prefixes.length === 0

    return renderRows(listSessions(db, prefixes), width, style, groupByDate)
}