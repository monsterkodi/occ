import { createStyle } from "./style.js"

const ID_WIDTH = 6
const START_WIDTH = 11
const DURATION_WIDTH = 4
const TURNS_WIDTH = 4
const PADDING = 1

const COLUMN_WIDTH = ID_WIDTH + START_WIDTH + DURATION_WIDTH + TURNS_WIDTH

export const FIXED_WIDTH = COLUMN_WIDTH + (2 * PADDING) * 4

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const YEAR = 365 * DAY

export function humanDuration(ms)
{
    const value = Math.max(0, ms)
    if (value < MINUTE) return `${Math.floor(value / SECOND)}s`
    if (value < HOUR) return `${Math.floor(value / MINUTE)}m`
    if (value < DAY) return `${Math.floor(value / HOUR)}h`
    if (value < YEAR) return `${Math.floor(value / DAY)}d`
    return `${Math.floor(value / YEAR)}y`
}

function crop(text, width)
{
    if (width <= 0) return ""
    if (text.length <= width) return text
    if (width === 1) return "…"
    return text.slice(0, width - 1) + "…"
}

function stamp(ms)
{
    const d = new Date(ms)
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const hh = String(d.getHours()).padStart(2, "0")
    const mi = String(d.getMinutes()).padStart(2, "0")
    return `${mm}-${dd} ${hh}:${mi}`
}

function padded(text, width)
{
    const fill = Math.max(0, width - text.length)
    return " ".repeat(PADDING) + text + " ".repeat(fill + PADDING)
}

function paddedRight(text, width)
{
    const fill = Math.max(0, width - text.length)
    return " ".repeat(PADDING + fill) + text + " ".repeat(PADDING)
}

function markerAgent(style, agent)
{
    return agent
        ? style.turn.agent("> agent ") + style.turn.mode(agent)
        : style.turn.agent("> agent")
}

function renderCall(block, style, inAgentRun)
{
    const marker = style.tool.call(`$ ${block.name}`)
    if (inAgentRun) return [marker, block.command, true]
    return [`${markerAgent(style, block.agent)}\n${marker}`, block.command, true]
}

function renderResult(block, style, inAgentRun)
{
    const text = block.text.trimEnd()
    if (text === "") return [null, null, inAgentRun]

    const tail = block.outputPath
        ? `${text}\n${style.tool.note(`… full output at ${block.outputPath}`)}`
        : text
    return [style.tool.result(`$ ${block.name} result`), tail, inAgentRun]
}

function renderTurn(block, style, inAgentRun)
{
    const text = (block.text ?? "").trimEnd()
    if (text === "") return [null, null, inAgentRun]

    if (block.role === "user") return [style.turn.user("> user"), text, false]

    return inAgentRun
        ? [style.turn.continue("…"), text, true]
        : [markerAgent(style, block.agent), text, true]
}

function renderBlock(block, style, inAgentRun)
{
    if (block.kind === "call") return renderCall(block, style, inAgentRun)

    if (block.kind === "exit")
    {
        return [style.tool.exit(`$ ${block.name} exit ${block.code}`), "", inAgentRun]
    }

    if (block.kind === "result") return renderResult(block, style, inAgentRun)

    return renderTurn(block, style, inAgentRun)
}

export function renderBlocks(blocks, style)
{
    const s = style ?? createStyle(false)
    const lines = []
    let inAgentRun = false

    for (const block of blocks)
    {
        const [marker, text, next] = renderBlock(block, s, inAgentRun)
        inAgentRun = next
        if (marker === null) continue
        lines.push(marker)
        if (text !== "") lines.push(text)
    }

    return lines.join("\n")
}

export function renderSession(session, width, style)
{
    const s = style ?? createStyle(false)
    const nameWidth = Math.max(0, (width ?? 80) - FIXED_WIDTH - (2 * PADDING))
    const name = crop(session.title ?? "NULL", nameWidth)
    const duration = humanDuration(session.time_updated - session.time_created)

    const cells = [
        s.row.id(padded(session.id.replace(/^ses_/, "").slice(0, ID_WIDTH), ID_WIDTH)),
        s.row.start(padded(stamp(session.time_created), START_WIDTH)),
        s.row.duration(paddedRight(duration, DURATION_WIDTH)),
        s.row.turns(paddedRight(String(session.turns ?? 0), TURNS_WIDTH)),
        s.row.name(padded(name, nameWidth)),
    ]

    return cells.join("")
}
