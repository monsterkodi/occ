import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { buildTestDb, countRows } from "./fixtures/build.js"
import { openWritable, OclsError } from "../src/db.js"
import { del } from "../src/del.js"
import { createColor } from "../src/render.js"

const plain = createColor(false)
const A = "ses_aaaaaaaaaaaaaaaaaaaaaaaaa1"
const C = "ses_ccccccccccccccccccccccc3"

function io(answer = "y") {
  const out = []
  const answers = [...answer]
  return {
    write: (s) => out.push(s),
    readAnswer: () => answers.shift(),
    interactive: true,
    get output() {
      return out.join("")
    },
  }
}

const run = (ids, answer = "y", width = 80) => {
  const terminal = io(answer)
  const db = openWritable(buildTestDb())
  try {
    const result = del({ db, prefixes: ids, width, color: plain, io: terminal })
    return { ...result, text: terminal.output }
  } finally {
    db.close()
  }
}

describe("openWritable", () => {
  test("can actually write", () => {
    const db = openWritable(buildTestDb())
    db.prepare("DELETE FROM session_v2 WHERE id = ?").run(A)
    assert.equal(db.prepare("SELECT count(*) AS c FROM session_v2 WHERE id = ?").get(A).c, 0)
    db.close()
  })

  test("has foreign keys enforced", () => {
    const db = openWritable(buildTestDb())
    assert.equal(db.prepare("PRAGMA foreign_keys").get().foreign_keys, 1)
    db.close()
  })

  test("rejects a bad schema the same way openDb does", () => {
    assert.throws(() => openWritable("/nonexistent/opencode.db"), OclsError)
  })
})

describe("del confirmation", () => {
  test("shows a warning, the sessions, and the question", () => {
    const { text } = run(["aaaaaa"])
    assert.match(text, /WARNING! ABOUT TO DELETE THESE SESSIONS/)
    assert.match(text, /aaaaaa.*First session/s)
    assert.match(text, /ARE YOU SURE\? \(yN\)/)
  })

  test("the warning comes before the session list", () => {
    const { text } = run(["aaaaaa"])
    assert.ok(text.indexOf("WARNING!") < text.indexOf("aaaaaa"))
    assert.ok(text.indexOf("aaaaaa") < text.indexOf("ARE YOU SURE"))
  })

  test("n aborts without deleting", () => {
    const { deleted, text } = run(["aaaaaa"], "n")
    assert.deepEqual(deleted, [])
    assert.match(text, /nothing deleted/i)
  })

  test("empty input aborts", () => {
    assert.deepEqual(run(["aaaaaa"], "").deleted, [])
  })

  test("anything other than y aborts", () => {
    assert.deepEqual(run(["aaaaaa"], "maybe").deleted, [])
  })

  test("yes is accepted too", () => {
    assert.equal(run(["aaaaaa"], "yes").deleted.length, 1)
  })

  test("a non-interactive terminal refuses without deleting", () => {
    const terminal = { ...io(), interactive: false }
    const db = openWritable(buildTestDb())
    try {
      assert.throws(
        () => del({ db, prefixes: ["aaaaaa"], width: 80, color: plain, io: terminal }),
        (e) => e instanceof OclsError && /terminal/i.test(e.message),
      )
    } finally {
      db.close()
    }
  })

  test("no ids is an error, and nothing is printed first", () => {
    assert.throws(() => run([]), (e) => e instanceof OclsError && /id/i.test(e.message))
  })

  test("an unknown id errors before the warning", () => {
    assert.throws(() => run(["zzzzzz"]), /no session/i)
  })
})

describe("del deletion", () => {
  test("removes the session row", () => {
    const db = openWritable(buildTestDb())
    try {
      del({ db, prefixes: ["aaaaaa"], width: 80, color: plain, io: io() })
      assert.equal(
        db.prepare("SELECT count(*) AS c FROM session_v2 WHERE id = ?").get(A).c,
        0,
      )
    } finally {
      db.close()
    }
  })

  test("cascades to all five child tables", () => {
    const db = openWritable(buildTestDb())
    const before = countRows(db, A)
    assert.ok(
      Object.values(before).every((n) => n > 0),
      `fixture should populate every child table, got ${JSON.stringify(before)}`,
    )

    del({ db, prefixes: ["aaaaaa"], width: 80, color: plain, io: io() })

    const after = countRows(db, A)
    for (const [table, n] of Object.entries(after)) {
      assert.equal(n, 0, `${table} kept ${n} rows`)
    }
    db.close()
  })

  test("leaves other sessions and their children alone", () => {
    const db = openWritable(buildTestDb())
    try {
      del({ db, prefixes: ["aaaaaa"], width: 80, color: plain, io: io() })
      assert.equal(
        db.prepare("SELECT count(*) AS c FROM session_v2 WHERE id = ?").get(C).c,
        1,
      )
      assert.ok(Object.values(countRows(db, C)).every((n) => n > 0))
    } finally {
      db.close()
    }
  })

  test("reports what it deleted, in the ids given", () => {
    assert.deepEqual(run(["aaaaaa", "cccccc"]).deleted, [A, C])
  })

  test("an aborted delete leaves the rows untouched", () => {
    const db = openWritable(buildTestDb())
    try {
      del({ db, prefixes: ["aaaaaa"], width: 80, color: plain, io: io("n") })
      assert.equal(
        db.prepare("SELECT count(*) AS c FROM session_v2 WHERE id = ?").get(A).c,
        1,
      )
    } finally {
      db.close()
    }
  })
})
