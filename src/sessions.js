import { listSessions, getSession } from "./query.js"
import { renderSession, renderBlocks } from "./render.js"

export function renderSessions(db, prefixes, width, style, filter)
{
    const blocks = []

    for (const session of listSessions(db, prefixes))
    {
        const { row, blocks: history } = getSession(db, session.id)
        const head = renderSession(row, width, style)
        const body = renderBlocks(filter(history), style)
        blocks.push(body === "" ? head : `${head}\n${body}`)
    }

    return blocks.join("\n\n")
}
