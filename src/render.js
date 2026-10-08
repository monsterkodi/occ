import { createStyle } from "./style.js"

const ID_WIDTH = 6
const LAST_WIDTH = 11
const DURATION_WIDTH = 6
const TURNS_WIDTH = 4
const PADDING = 1

const COLUMN_WIDTH = ID_WIDTH + LAST_WIDTH + DURATION_WIDTH + TURNS_WIDTH

export const FIXED_WIDTH = COLUMN_WIDTH + (2 * PADDING) * 4

const MINUTE = 60_000

export function durationMinutes(ms)
{
    return String(Math.floor(Math.max(0, ms) / MINUTE))
}

function crop(text, width)
{
    if (width <= 0) return ""
    if (text.length <= width) return text
    if (width === 1) return "…"
    return text.slice(0, width - 1) + "…"
}

function parts(ms)
{
    const d = new Date(ms)
    const pad = (n) => String(n).padStart(2, "0")
    return {
        date: `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    }
}

export function dayKey(ms)
{
    return parts(ms).date
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

function lastOf(session)
{
    return session.time_last ?? session.time_updated
}

export function renderSession(session, width, style, { repeatDate = false } = {})
{
    const s = style ?? createStyle(false)
    const nameWidth = Math.max(0, (width ?? 80) - FIXED_WIDTH - (2 * PADDING))
    const name = crop(session.title ?? "NULL", nameWidth)
    const duration = durationMinutes(lastOf(session) - session.time_created)
    const when = parts(lastOf(session))
    const shown = repeatDate ? `      ${when.time}` : `${when.date} ${when.time}`

    const cells = [
        s.row.id(padded(session.id.replace(/^ses_/, "").slice(0, ID_WIDTH), ID_WIDTH)),
        s.row.last(padded(shown, LAST_WIDTH)),
        s.row.duration(paddedRight(duration, DURATION_WIDTH)),
        s.row.turns(paddedRight(String(session.turns ?? 0), TURNS_WIDTH)),
        s.row.name(padded(name, nameWidth)),
    ]

    return cells.join("")
}
