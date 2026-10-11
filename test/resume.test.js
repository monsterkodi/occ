import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { buildTestDb } from "./fixtures/build.js"
import { openDb, openWritable, OclsError } from "../src/db.js"
import { resume, personaOf } from "../src/resume.js"

const A = "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"
const B = "ses_bbbbbbbbbbbbbbbbbbbbbbb2"

const GONE = "ses_9999999999999999999999g"

function withDb(fn)
{
    const db = openDb(buildTestDb())

    try
    {
        return fn(db)
    }
    finally
    {
        db.close()
    }
}

function addSession(db, id, directory, title)
{
    db.prepare(
        "INSERT INTO session_v2 (id, project_id, parent_id, title, slug, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(id, "proj1", null, title, "quiet-fox", directory, 1, 2)
}

// a run that records the plans it was handed, so a test can look at both what
// was launched and what was refused before launching
function attempt(prefixes, options = {})
{
    const plans = []
    const launch = (plan) =>
    {
        plans.push(plan)
        return options.code ?? 0
    }

    const code = () =>
        withDb((db) =>
            resume({
                db,
                prefixes,
                io: { interactive: options.interactive ?? true },
                launch,
            }))

    return { plans, code }
}

describe("personaOf", () => {
    test("the directory basename is the persona", () =>
    {
        assert.equal(personaOf("/home/kodi/a/coco"), "coco")
        assert.equal(personaOf("/home/kodi/a/bert"), "bert")
    })

    test("a dot directory can name a persona of its own", () =>
    {
        assert.equal(personaOf("/home/kodi/.config"), "sepp")
    })

    test("the persona is lowercased", () =>
    {
        assert.equal(personaOf("/home/kodi/A/Coco"), "coco")
    })

    test("a trailing slash does not matter", () =>
    {
        assert.equal(personaOf("/home/kodi/a/coco/"), "coco")
    })
})

describe("resume guards", () => {
    test("no session at all is refused", async () =>
    {
        await assert.rejects(() => attempt([]).code(), (e) =>
            e instanceof OclsError && /exactly one session id/i.test(e.message))
    })

    test("two sessions are refused", async () =>
    {
        await assert.rejects(() => attempt(["aaaaaa", "cccccc"]).code(), (e) =>
            e instanceof OclsError && /got 2/.test(e.message))
    })

    test("a fragment matching several sessions is refused", async () =>
    {
        await assert.rejects(() => attempt(["o"]).code(), (e) =>
            e instanceof OclsError && /matches 2 sessions/.test(e.message))
    })

    test("the refusal names the fragment and the count", async () =>
    {
        await assert.rejects(() => attempt(["o"]).code(), /"o".*2/)
    })

    test("an unknown session is refused", async () =>
    {
        await assert.rejects(() => attempt(["zzzzzz"]).code(), /no session matches/)
    })

    test("a non-interactive terminal is refused", async () =>
    {
        await assert.rejects(
            () => attempt(["aaaaaa"], { interactive: false }).code(),
            (e) => e instanceof OclsError && /terminal/i.test(e.message),
        )
    })

    test("a session whose directory is gone is refused", async () =>
    {
        const plans = []
        const db = openWritable(buildTestDb())

        try
        {
            addSession(db, GONE, "/nonexistent/persona", "Gone - nothing")

            await assert.rejects(() =>
                resume({
                    db,
                    prefixes: [GONE],
                    io: { interactive: true },
                    launch: (plan) => plans.push(plan),
                }),
                (e) => e instanceof OclsError && e.message.includes("/nonexistent/persona"))
        }
        finally
        {
            db.close()
        }

        assert.deepEqual(plans, [])
    })

    test("nothing is launched when a guard fires", async () =>
    {
        for (const prefixes of [[], ["aaaaaa", "cccccc"], ["o"], ["zzzzzz"]])
        {
            const run = attempt(prefixes)
            await assert.rejects(() => run.code())
            assert.deepEqual(run.plans, [], `${prefixes.join(" ")} launched something`)
        }
    })
})

describe("resume plan", () => {
    test("runs opencode on the session", async () =>
    {
        const { plans, code } = attempt(["aaaaaa"])
        assert.equal(await code(), 0)
        assert.equal(plans.length, 1)
        assert.equal(plans[0].command, "opencode")
    })

    test("passes the full session id, never the prefix", async () =>
    {
        const { plans, code } = attempt(["aaaaaa"])
        await code()
        assert.deepEqual(plans[0].args, ["--session", A])
    })

    test("runs in the directory the session belongs to", async () =>
    {
        const { plans, code } = attempt(["aaaaaa"])
        await code()
        assert.equal(plans[0].cwd, "/home/kodi/a/coco")
    })

    test("sets the persona the session runs as", async () =>
    {
        const { plans, code } = attempt(["aaaaaa"])
        await code()
        assert.equal(plans[0].env.OPENCODE_PERSONA, "coco")
    })

    test("a title fragment resolves the same way", async () =>
    {
        const { plans, code } = attempt(["ocls"])
        await code()
        assert.deepEqual(plans[0].args, ["--session", A])
        assert.equal(plans[0].cwd, "/home/kodi/a/coco")
    })

    test("a session in .config resumes as sepp", async () =>
    {
        const { plans, code } = attempt(["bbbbbbb"])
        await code()
        assert.deepEqual(plans[0].args, ["--session", B])
        assert.equal(plans[0].cwd, "/home/kodi/.config")
        assert.equal(plans[0].env.OPENCODE_PERSONA, "sepp")
    })

    test("the rest of the environment is inherited", async () =>
    {
        const { plans, code } = attempt(["aaaaaa"])
        await code()
        assert.equal(plans[0].env.PATH, process.env.PATH)
    })

    test("returns the exit code opencode exited with", async () =>
    {
        assert.equal(await attempt(["aaaaaa"], { code: 42 }).code(), 42)
    })
})