import { renderSessions } from "./sessions.js"

const SHELL = "shell"

const onlyShell = (blocks) =>
    blocks.filter(
        (b) =>
            (b.kind === "call" || b.kind === "result" || b.kind === "exit") &&
            b.name === SHELL,
    )

export function shell({ db, prefixes = [], width = 80, style })
{
    return renderSessions(db, prefixes, width, style, onlyShell)
}
