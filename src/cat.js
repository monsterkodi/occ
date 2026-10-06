import { listSessions, getSession } from "./query.js"
import { renderSession, renderTurns } from "./render.js"

export function cat({ db, prefixes = [], width = 80, color }) {
  const sessions = listSessions(db, prefixes)
  const blocks = []

  for (const session of sessions) {
    const row = renderSession(session, width, color)
    const { messages } = getSession(db, session.id)
    const turns = renderTurns(messages, color)
    blocks.push(turns ? `${row}\n${turns}` : row)
  }

  return blocks.join("\n\n")
}
