var toExport = {}
var BAD_SCHEMA_DB_PATH, d, DB_PATH, fx, MISSING_COLUMN_DB_PATH, throwsOclsError

import db from "../db.js"

import build from "./fixtures/build.js"

import utils from "./utils.js"
let throws = utils.throws

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
toExport["resolveDbPath"] = async function ()
{
    await section("uses XDG_DATA_HOME when set", async function ()
    {
        compare(db.resolveDbPath({XDG_DATA_HOME:'/xdg'}),'/xdg/opencode/opencode.db')
    })
    await section("falls back to ~/.local/share", async function ()
    {
        compare(db.resolveDbPath({}),`${process.env.HOME}/.local/share/opencode/opencode.db`)
    })
}
toExport["resolveDbPath"]._section_ = true
toExport["openDb"] = async function ()
{
    await section("opens the fixture read-only", async function ()
    {
        d = db.openDb(DB_PATH)
        compare((d.prepare('SELECT count(*) c FROM session_v2').get()).c,4)
        throws(function ()
        {
            d.prepare('DELETE FROM session_v2').run()
            return /readonly/i
        })
        d.close()
    })
    await section("missing file gives a clear error", async function ()
    {
        throws(function ()
        {
            db.openDb('/nonexistent/opencode.db')
            return throwsOclsError(/no\x20database/i)
        })
    })
    await section("unrecognized schema gives a clear error", async function ()
    {
        throws(function ()
        {
            db.openDb(BAD_SCHEMA_DB_PATH)
            return throwsOclsError(/schema/i)
        })
    })
    await section("missing required column gives a clear error", async function ()
    {
        throws(function ()
        {
            db.openDb(MISSING_COLUMN_DB_PATH)
            return throwsOclsError(/time_updated/)
        })
    })
}
toExport["openDb"]._section_ = true
toExport._test_ = true
export default toExport


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC9kYi5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBZUEsS0FBSyxNQUFNO0FBRVgsVUFBVSxHQUFHO0FBQ2IscUJBQXFCLEdBQUc7QUFDeEIseUJBQXlCLEdBQUc7O0FBRTVCOzs7O2VBQXNDLGFBQWEsR0FBRyxjQUFlLFFBQVEsS0FBSyxFQUFFOzs7Ozs7O2dCQU01RSxHQUFHLGVBQWUsY0FBZSxTQUFXOzs7O2dCQUk1QyxHQUFHLHFCQUF1QixRQUFRLElBQUk7Ozs7Ozs7O1FBTXRDLElBQUksR0FBRyxPQUFPO2lCQUViLEVBQUUsUUFBUSxxQ0FBcUMsT0FBTyxFQUFJO1FBQzNEOztZQUFVLEVBQUUsUUFBUSwwQkFBMEI7bUJBQU87O1FBRXJELEVBQUU7Ozs7UUFJRjs7WUFBVSxHQUFHLE9BQU87bUJBQTZCLGdCQUFnQjs7Ozs7UUFJakU7O1lBQVUsR0FBRyxPQUFPO21CQUFxQixnQkFBZ0I7Ozs7O1FBSXpEOztZQUFVLEdBQUcsT0FBTzttQkFBeUIsZ0JBQWdCIn0=
//# sourceURL=file://kode/test/db.kode
