var BAD_SCHEMA_DB_PATH, DB_PATH, fx, MISSING_COLUMN_DB_PATH, throwsOclsError

import test from 'node:test'
import assert from 'node:assert/strict'
import build from "../test/fixtures/build.js"

import db from "../db.js"

fx = build.fixtures()
DB_PATH = fx.DB_PATH
BAD_SCHEMA_DB_PATH = fx.BAD_SCHEMA_DB_PATH
MISSING_COLUMN_DB_PATH = fx.MISSING_COLUMN_DB_PATH

throwsOclsError = function (pattern)
{
    return function (e)
    {
        return e instanceof db.OclsError && (pattern.test,e.message)
    }
}
test.describe('resolveDbPath',function ()
{
    test('uses XDG_DATA_HOME when set',function ()
    {
        return assert.equal(db.resolveDbPath({XDG_DATA_HOME:'/xdg'}),'/xdg/opencode/opencode.db')
    })
    return test('falls back to ~/.local/share',function ()
    {
        return assert.equal(db.resolveDbPath({}),`${process.env.HOME}/.local/share/opencode/opencode.db`)
    })
})
test.describe('openDb',function ()
{
    test('opens the fixture read-only',function ()
    {
        var d

        d = db.openDb(DB_PATH)
        assert.equal((d.prepare('SELECT count(*) c FROM session_v2').get()).c,4)
        assert.throws(function ()
        {
            d.prepare('DELETE FROM session_v2').run()
            return /readonly/i
        })
        return d.close()
    })
    test('missing file gives a clear error',function ()
    {
        return assert.throws(function ()
        {
            db.openDb('/nonexistent/opencode.db')
            return throwsOclsError(/no\x20database/i)
        })
    })
    test('unrecognized schema gives a clear error',function ()
    {
        return assert.throws(function ()
        {
            db.openDb(BAD_SCHEMA_DB_PATH)
            return throwsOclsError(/schema/i)
        })
    })
    return test('missing required column gives a clear error',function ()
    {
        return assert.throws(function ()
        {
            db.openDb(MISSING_COLUMN_DB_PATH)
            return throwsOclsError(/time_updated/)
        })
    })
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIudGVzdC5qcyIsInNvdXJjZXMiOlsiLi4vLi4va29kZS90ZXN0X29sZC9kYi50ZXN0LmtvZGUiXSwibWFwcGluZ3MiOiI7O09BV08sS0FBSyxLQUFLO09BQ1YsT0FBTyxLQUFLOzs7OztBQUtuQixLQUFLLE1BQU07QUFFWCxVQUFVLEdBQUc7QUFDYixxQkFBcUIsR0FBRztBQUN4Qix5QkFBeUIsR0FBRzs7QUFFNUI7Ozs7ZUFBc0MsYUFBYSxHQUFHLGNBQWUsUUFBUSxLQUFLLEVBQUU7OztBQUVwRixLQUFLLFNBQVM7O0lBRVYsS0FBSzs7ZUFFRCxPQUFPLE1BQU0sR0FBRyxlQUFlLGNBQWUsU0FBVTs7V0FFNUQsS0FBSzs7ZUFFRCxPQUFPLE1BQU0sR0FBRyxxQkFBc0IsUUFBUSxJQUFJOzs7QUFFMUQsS0FBSyxTQUFTOztJQUVWLEtBQUs7Ozs7UUFFRCxJQUFJLEdBQUcsT0FBTztRQUVkLE9BQU8sT0FBTyxFQUFFLFFBQVEscUNBQXFDLE9BQU8sRUFBRztRQUN2RSxPQUFPOztZQUFVLEVBQUUsUUFBUSwwQkFBMEI7bUJBQU87O2VBRTVELEVBQUU7O0lBRU4sS0FBSzs7ZUFFRCxPQUFPOztZQUFVLEdBQUcsT0FBTzttQkFBNkIsZ0JBQWdCOzs7SUFFNUUsS0FBSzs7ZUFFRCxPQUFPOztZQUFVLEdBQUcsT0FBTzttQkFBcUIsZ0JBQWdCOzs7V0FFcEUsS0FBSzs7ZUFFRCxPQUFPOztZQUFVLEdBQUcsT0FBTzttQkFBeUIsZ0JBQWdCIn0=
//# sourceURL=file://kode/test_old/db.test.kode
