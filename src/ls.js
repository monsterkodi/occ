import { listSessions } from "./query.js"
import { renderSession } from "./render.js"

export function ls({ db, prefixes = [], width = 80, color }) {
  return listSessions(db, prefixes)
    .map((session) => renderSession(session, width, color))
    .join("\n")
}
