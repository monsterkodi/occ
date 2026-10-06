import { renderSessions } from "./sessions.js"

export function log({ db, prefixes = [], width = 80, style })
{
    return renderSessions(db, prefixes, width, style, (blocks) => blocks)
}
