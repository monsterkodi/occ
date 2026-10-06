import { renderSessions } from "./sessions.js"

function mergeTurns(blocks)
{
    const merged = []

    for (const block of blocks)
    {
        const previous = merged.at(-1)
        const sameMessage =
            previous !== undefined &&
            previous.kind === "turn" &&
            block.kind === "turn" &&
            previous.message === block.message

        if (sameMessage)
        {
            previous.text = `${previous.text}\n\n${block.text}`
            continue
        }

        merged.push({ ...block })
    }

    return merged
}

export function cat({ db, prefixes = [], width = 80, color })
{
    return renderSessions(db, prefixes, width, color, (blocks) =>
        mergeTurns(blocks.filter((b) => b.kind === "turn")),
    )
}
