import { listSessions, getSession } from "./query.js"
import { renderSession, renderBlocks } from "./render.js"

export function renderSessions(db, prefixes, width, color, filter) {
  const blocks = []

  for (const session of listSessions(db, prefixes)) {
    const { row, blocks: history } = getSession(db, session.id)
    const head = renderSession(row, width, color)
    const body = renderBlocks(filter(history), color)
    blocks.push(body === "" ? head : `${head}\n${body}`)
  }

  return blocks.join("\n\n")
}
