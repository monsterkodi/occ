const ID_WIDTH = 6
const START_WIDTH = 11
const DURATION_WIDTH = 4
const TURNS_WIDTH = 4
const GAP = 2

export const FIXED_WIDTH =
  ID_WIDTH + GAP + START_WIDTH + GAP + DURATION_WIDTH + GAP + TURNS_WIDTH

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const YEAR = 365 * DAY

export function humanDuration(ms) {
  const value = Math.max(0, ms)
  if (value < MINUTE) return `${Math.floor(value / SECOND)}s`
  if (value < HOUR) return `${Math.floor(value / MINUTE)}m`
  if (value < DAY) return `${Math.floor(value / HOUR)}h`
  if (value < YEAR) return `${Math.floor(value / DAY)}d`
  return `${Math.floor(value / YEAR)}y`
}

const VISIBLE = /\x1b\[[0-9;]*m/g

function visibleLength(text) {
  return text.replace(VISIBLE, "").length
}

function padStart(text, width) {
  const fill = width - visibleLength(text)
  return fill > 0 ? " ".repeat(fill) + text : text
}

function padEnd(text, width) {
  const fill = width - visibleLength(text)
  return fill > 0 ? text + " ".repeat(fill) : text
}

function crop(text, width) {
  if (width <= 0) return ""
  if (text.length <= width) return text
  if (width === 1) return "…"
  return text.slice(0, width - 1) + "…"
}

function stamp(ms) {
  const d = new Date(ms)
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${mm}-${dd} ${hh}:${mi}`
}

const CODES = {
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49],
  bgGray: [100, 49],
}

function makeStyle(enabled) {
  const style = (text) => String(text)
  if (!enabled) {
    for (const key of Object.keys(CODES)) style[key] = style
    return style
  }
  for (const [key, [open, close]] of Object.entries(CODES)) {
    style[key] = (text) => `\x1b[${open}m${text}\x1b[${close}m`
  }
  return style
}

export function createColor(enabled) {
  return makeStyle(Boolean(enabled))
}

function markerUser(c) {
  return c.bgBlue(c.bold("> user"))
}

function markerAgent(c, agent) {
  const head = c.bgCyan(c.bold("> agent "))
  return agent ? head + c.bgGray(c.black(agent)) : head.trimEnd()
}

export function renderTurns(turns, color) {
  const c = color ?? createColor(false)
  const lines = []

  for (const turn of turns) {
    const text = (turn.text ?? "").trimEnd()
    if (text === "") continue
    const marker =
      turn.role === "user" ? markerUser(c) : markerAgent(c, turn.agent)
    lines.push(marker, text)
  }

  return lines.join("\n")
}

export function renderSession(session, width, color) {
  const c = color ?? createColor(false)
  const nameWidth = Math.max(0, (width ?? 80) - FIXED_WIDTH - GAP)
  const name = crop(session.title ?? "NULL", nameWidth)

  const cells = [
    padEnd(c.gray(session.id.replace(/^ses_/, "").slice(0, ID_WIDTH)), ID_WIDTH),
    padEnd(c.gray(stamp(session.time_created)), START_WIDTH),
    padStart(c.yellow(humanDuration(session.time_updated - session.time_created)), DURATION_WIDTH),
    padStart(c.cyan(String(session.turns ?? 0)), TURNS_WIDTH),
    c.bold(name),
  ]

  return cells.join(" ".repeat(GAP)).replace(/\s+$/, "")
}
