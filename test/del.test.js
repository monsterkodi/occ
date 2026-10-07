import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { buildTestDb, countRows } from "./fixtures/build.js"
import { openWritable, OclsError } from "../src/db.js"
import { del } from "../src/del.js"
import { createStyle } from "../src/style.js"

const plain = createStyle(false)
const A = "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"
const C = "ses_ccccccccccccccccccccccc3"

function io(answer = "y", interactive = true)
{
    const out = []
    const answers = [...answer]

    return {
        interactive,
        write: (text) => out.push(text),
        readAnswer: () => answers.shift(),
        get output()
        {
            return out.join("")
        },
    }
}

const run = (ids, answer = "y", width = 80) =>
{
    const terminal = io(answer)
    const db = openWritable(buildTestDb())

    try
    {
        const result = del({ db, prefixes: ids, width, style: plain, io: terminal })
        return { ...result, text: terminal.output }
    }
    finally
    {
        db.close()
    }
}

const withDb = (fn) =>
{
    const db = openWritable(buildTestDb())

    try
    {
        return fn(db)
    }
    finally
    {
        db.close()
    }
}

const deleteA = (db, answer = "y") =>
    del({ db, prefixes: ["aaaaaa"], width: 80, style: plain, io: io(answer) })

const rowCount = (db, id) =>
    db.prepare("SELECT count(*) AS c FROM session_v2 WHERE id = ?").get(id).c

describe("openWritable", () => {
    test("can actually write", () =>
    {
        withDb((db) =>
        {
            db.prepare("DELETE FROM session_v2 WHERE id = ?").run(A)
            assert.equal(rowCount(db, A), 0)
        })
    })

    test("has foreign keys enforced", () =>
    {
        withDb((db) => assert.equal(db.prepare("PRAGMA foreign_keys").get().foreign_keys, 1))
    })

    test("rejects a bad schema the same way openDb does", () =>
    {
        assert.throws(() => openWritable("/nonexistent/opencode.db"), OclsError)
    })
})

describe("del guards", () => {
    test("no ids is an error, and nothing is printed first", () =>
    {
        assert.throws(
            () => run([]),
            (e) => e instanceof OclsError && /id/i.test(e.message),
        )
    })

    test("an argument shorter than three characters is refused", () =>
    {
        for (const short of ["a", "ab"])
        {
            assert.throws(
                () => run([short]),
                (e) => e instanceof OclsError && /at least 3 characters/i.test(e.message),
                `"${short}" should be refused`,
            )
        }
    })

    test("the refusal names the arguments it rejected", () =>
    {
        assert.throws(
            () => run(["ab", "ocls", "cd"]),
            (e) => e.message.includes("ab") && e.message.includes("cd"),
        )
    })

    test("nothing is deleted when an argument is too short", () =>
    {
        withDb((db) =>
        {
            assert.throws(() =>
                del({ db, prefixes: ["ab"], width: 80, style: plain, io: io("y") }))
            assert.equal(rowCount(db, A), 1)
        })
    })

    test("a three character title argument is accepted", () =>
    {
        assert.deepEqual(run(["oco"], "y").deleted, [A])
    })

    test("an unknown id errors before the warning", () =>
    {
        assert.throws(() => run(["zzzzzz"]), /no session/i)
    })

    test("a non-interactive terminal refuses without deleting", () =>
    {
        withDb((db) =>
            assert.throws(
                () => del({ db, prefixes: ["aaaaaa"], width: 80, style: plain, io: io("y", false) }),
                (e) => e instanceof OclsError && /terminal/i.test(e.message),
            ))
    })
})

describe("del confirmation", () => {
    test("shows a warning, the sessions, and the question", () =>
    {
        const { text } = run(["aaaaaa"])
        assert.match(text, /DELETE SESSIONS/)
        assert.match(text, /aaaaaa.*Coco - ocls/s)
        assert.match(text, /ARE YOU SURE\? \(yN\)/)
    })

    test("the warning comes before the session list", () =>
    {
        const { text } = run(["aaaaaa"])
        assert.ok(text.indexOf("DELETE SESSIONS") < text.indexOf("aaaaaa"))
        assert.ok(text.indexOf("aaaaaa") < text.indexOf("ARE YOU SURE"))
    })

    test("n aborts without deleting", () =>
    {
        const { deleted, text } = run(["aaaaaa"], "n")
        assert.deepEqual(deleted, [])
        assert.match(text, /nothing deleted/i)
    })

    test("empty input aborts", () =>
    {
        assert.deepEqual(run(["aaaaaa"], "").deleted, [])
    })

    test("anything other than y aborts", () =>
    {
        assert.deepEqual(run(["aaaaaa"], "maybe").deleted, [])
    })

    test("yes is accepted too", () =>
    {
        assert.equal(run(["aaaaaa"], "yes").deleted.length, 1)
    })
})

describe("del deletion", () => {
    test("accepts a title argument and deletes what it matched", () =>
    {
        withDb((db) =>
        {
            del({ db, prefixes: ["ocls"], width: 80, style: plain, io: io("y") })
            assert.equal(rowCount(db, A), 0)
            assert.equal(rowCount(db, C), 1)
        })
    })

    test("accepts a mix of ids and titles", () =>
    {
        withDb((db) =>
        {
            del({ db, prefixes: ["aaaaaaa", "ocls"], width: 80, style: plain, io: io("y") })
            assert.equal(rowCount(db, A), 0)
        })
    })

    test("removes the session row", () =>
    {
        withDb((db) =>
        {
            deleteA(db)
            assert.equal(rowCount(db, A), 0)
        })
    })

    test("cascades to all five child tables", () =>
    {
        withDb((db) =>
        {
            const before = countRows(db, A)
            assert.ok(
                Object.values(before).every((n) => n > 0),
                `fixture should populate every child table, got ${JSON.stringify(before)}`,
            )

            deleteA(db)

            const after = countRows(db, A)
            for (const [table, n] of Object.entries(after))
            {
                assert.equal(n, 0, `${table} kept ${n} rows`)
            }
        })
    })

    test("leaves other sessions and their children alone", () =>
    {
        withDb((db) =>
        {
            deleteA(db)
            assert.equal(rowCount(db, C), 1)
            assert.ok(Object.values(countRows(db, C)).every((n) => n > 0))
        })
    })

    test("reports what it deleted, in the ids given", () =>
    {
        assert.deepEqual(run(["aaaaaa", "cccccc"]).deleted, [A, C])
    })

    test("an aborted delete leaves the rows untouched", () =>
    {
        withDb((db) =>
        {
            deleteA(db, "n")
            assert.equal(rowCount(db, A), 1)
        })
    })
})
