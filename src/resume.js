import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { basename } from "node:path"
import { listSessions } from "./query.js"
import { OclsError } from "./db.js"

// A session runs in a directory, and the directory names the persona that runs
// it - the same rule the persona plugin uses to title sessions. PERSONAS holds
// the directories whose name says nothing about who they belong to.
const PERSONAS = { ".config": "sepp" }

export function personaOf(directory)
{
    const name = basename(directory)
    return PERSONAS[name] ?? name.toLowerCase()
}

function startOpencode({ command, args, cwd, env })
{
    // from here on the tui owns the terminal, so occ keeps its hands off ctrl-c
    process.on("SIGINT", () => {})

    return new Promise((resolve, reject) =>
    {
        const child = spawn(command, args, { cwd, env, stdio: "inherit" })

        child.on("error", (e) => reject(new OclsError(`cannot start ${command}: ${e.message}`)))
        child.on("close", (code) => resolve(code ?? 0))
    })
}

export async function resume({ db, prefixes = [], io, launch = startOpencode })
{
    if (prefixes.length !== 1)
    {
        throw new OclsError(
            prefixes.length === 0
                ? "resume needs exactly one session id"
                : `resume takes one session id, got ${prefixes.length}`,
        )
    }

    if (!io.interactive)
    {
        throw new OclsError("resume needs a terminal to hand over to")
    }

    const [prefix] = prefixes
    const sessions = listSessions(db, prefixes)

    if (sessions.length > 1)
    {
        throw new OclsError(`"${prefix}" matches ${sessions.length} sessions, resume takes one`)
    }

    const [session] = sessions

    if (!existsSync(session.directory))
    {
        throw new OclsError(`the directory of "${prefix}" is gone: ${session.directory}`)
    }

    return launch({
        command: "opencode",
        // the full id, never the prefix: opencode creates a session for an id
        // it does not know, and a prefix is an id it will never know
        args: ["--session", session.id],
        cwd: session.directory,
        env: { ...process.env, OPENCODE_PERSONA: personaOf(session.directory) },
    })
}