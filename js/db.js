var connect, openDb, openWritable, probe, REQUIRED_COLUMNS, resolveDbPath

import sqlite from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
class OclsError extends Error
{
    constructor (message)
    {
        super(message)
    
        this.name = 'OclsError'
    }
}

REQUIRED_COLUMNS = ['id','title','directory','time_created','time_updated']

probe = function (db, p)
{
    var columns, missing, rows

    rows = db.prepare("SELECT name FROM pragma_table_info('session_v2')").all()
    columns = new Set(rows.map(function (r)
    {
        return r.name
    }))
    if (columns.size === 0)
    {
        db.close()
        throw new OclsError(`unrecognized schema in ${p}: table session_v2 not found, opencode may have changed its storage format`)
    }
    missing = REQUIRED_COLUMNS.filter(function (c)
    {
        return !columns.has(c)
    })
    if (missing.length > 0)
    {
        db.close()
        throw new OclsError(`unrecognized schema in ${p}: session_v2 is missing ${missing.join(', ')}`)
    }
}

resolveDbPath = function (env = process.env)
{
    var base

    base = env.XDG_DATA_HOME ? env.XDG_DATA_HOME : path.join(os.homedir(),'.local','share')
    return path.join(base,'opencode','opencode.db')
}

connect = function (p, options)
{
    var db

    if (!fs.existsSync(p))
    {
        throw new OclsError(`no database at ${p}`)
    }
    db = undefined
    try
    {
        db = new sqlite.DatabaseSync(p,options)
    }
    catch (e)
    {
        throw new OclsError(`cannot open ${p}: ${e.message}`)
    }
    probe(db,p)
    return db
}

openDb = function (p)
{
    return connect(p,{readOnly:true})
}

openWritable = function (p)
{
    var db

    db = connect(p,{})
    db.exec('PRAGMA foreign_keys = ON')
    return db
}
export default {
    OclsError:OclsError,
    resolveDbPath:resolveDbPath,
    openDb:openDb,
    openWritable:openWritable
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VzIjpbIi4uL2tvZGUvZGIua29kZSJdLCJtYXBwaW5ncyI6Ijs7T0FlTyxPQUFPLEtBQUs7T0FDWixHQUFHLEtBQUs7T0FDUixLQUFLLEtBQUs7T0FDVixHQUFHLEtBQUs7d0JBRVM7Ozs7Y0FHVjs7UUFDTixLQUFDLE9BQU87Ozs7QUFFaEIsb0JBQW9CLEtBQUssUUFBUSxZQUFZLGVBQWU7O0FBRTVEOzs7O0lBRUksT0FBTyxHQUFHLFFBQVEsb0RBQW9EO0lBQ3RFLGNBQWMsSUFBSSxLQUFLOztlQUFXLEVBQUU7O1FBRWpDLFFBQVEsU0FBUTs7UUFDZixHQUFHO1FBQ0gsVUFBVSxvQ0FBb0M7O0lBRWxELFVBQVUsaUJBQWlCOztnQkFBa0IsUUFBUSxJQUFJOztRQUV0RCxRQUFRLFNBQVM7O1FBQ2hCLEdBQUc7UUFDSCxVQUFVLG9DQUFvQyw0QkFBNEIsUUFBUSxLQUFLOzs7O0FBRS9GOzs7O0lBRUksT0FBVSxJQUFJLGdCQUFtQixJQUFJLGdCQUFtQixLQUFLLEtBQUssR0FBRyxVQUFXLFNBQVU7V0FDMUYsS0FBSyxLQUFLLEtBQU0sV0FBWTs7O0FBRWhDOzs7O1NBRVcsR0FBRyxXQUFXOztRQUNqQixVQUFVLDRCQUE0Qjs7SUFFMUMsS0FBSzs7O1FBRUQsU0FBUyxPQUFPLGFBQWEsRUFBRzs7V0FDOUI7O1FBQ0YsVUFBVSx5QkFBeUIsTUFBTSxFQUFFOztJQUUvQyxNQUFNLEdBQUk7V0FDVjs7O0FBRUo7O1dBQWdCLFFBQVEsR0FBSSxTQUFVOzs7QUFFdEM7Ozs7SUFFSSxLQUFLLFFBQVE7SUFDYixHQUFHLEtBQUs7V0FDUjs7O0lBR0EsVUFBVztJQUNYLGNBQWU7SUFDZixPQUFRO0lBQ1IsYUFBYyJ9
//# sourceURL=file://kode/db.kode
