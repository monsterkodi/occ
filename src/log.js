import { renderSessions } from "./sessions.js"

export function log({ db, prefixes = [], width = 80, color }) {
  return renderSessions(db, prefixes, width, color, (blocks) => blocks)
}
