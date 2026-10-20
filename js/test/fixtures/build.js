var A, BASE, build, buildBadSchemaDb, buildControlBytesDb, buildMissingColumnDb, buildTestDb, C, cached, CHILD_DDL, CHILD_TABLES, CONTROL_RESULT, CONTROL_SESSION, CONTROL_TITLE, countRows, fixtures, makeDataHome, msg, reasoning, run, seed, seedChildren, seedControlBytes, seedMessages, seedSessions, SESSION_DDL, text, tool

import sqlite from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
BASE = 1791283494422
SESSION_DDL = `CREATE TABLE session_v2 (
  id text PRIMARY KEY,
  project_id text NOT NULL,
  parent_id text,
  title text,
  slug text NOT NULL,
  directory text NOT NULL,
  time_created integer NOT NULL,
  time_updated integer NOT NULL
)`
CHILD_DDL = `CREATE TABLE session_message (
  id text PRIMARY KEY,
  session_id text NOT NULL,
  type text NOT NULL,
  seq integer NOT NULL,
  time_created integer NOT NULL,
  time_updated integer NOT NULL,
  data text NOT NULL,
  FOREIGN KEY (session_id) REFERENCES session_v2(id) ON DELETE CASCADE
);

CREATE TABLE session_pending (
  id text PRIMARY KEY,
  session_id text NOT NULL,
  type text NOT NULL,
  data text NOT NULL,
  delivery text NOT NULL,
  admitted_seq integer NOT NULL,
  time_created integer NOT NULL,
  FOREIGN KEY (session_id) REFERENCES session_v2(id) ON DELETE CASCADE
);

CREATE TABLE session_inbox (
  id text PRIMARY KEY,
  session_id text NOT NULL,
  type text NOT NULL,
  payload text NOT NULL,
  delivery text NOT NULL,
  enqueued_seq integer NOT NULL,
  time_created integer NOT NULL,
  FOREIGN KEY (session_id) REFERENCES session_v2(id) ON DELETE CASCADE
);

CREATE TABLE instruction_entry (
  session_id text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  removed integer NOT NULL DEFAULT 0,
  time_created integer NOT NULL,
  time_updated integer NOT NULL,
  PRIMARY KEY (session_id, key),
  FOREIGN KEY (session_id) REFERENCES session_v2(id) ON DELETE CASCADE
);

CREATE TABLE instruction_state (
  session_id text PRIMARY KEY,
  epoch_start integer NOT NULL,
  through_seq integer NOT NULL,
  initial_values text NOT NULL,
  current_values text NOT NULL,
  FOREIGN KEY (session_id) REFERENCES session_v2(id) ON DELETE CASCADE
);`
CHILD_TABLES = ['session_message','session_pending','session_inbox','instruction_entry','instruction_state']
A = 'ses_aaaaaaaaaaaaaaaaaaaaaaaaa1'
C = 'ses_ccccccccccccccccccccccc3'

countRows = function (db, sessionId)
{
    var counts

    counts = CHILD_TABLES.map(function (table)
    {
        var row

        row = db.prepare(`SELECT count(*) AS c FROM ${table} WHERE session_id = ?`).get(sessionId)
        return [table,row.c]
    })
    return Object.fromEntries(counts)
}

run = function (stmt, args)
{
    return stmt.run.apply(stmt,args)
}

msg = function (id, sessionId, type, seq, payload)
{
    var at

    at = BASE + seq * 1000
    return [id,sessionId,type,seq,at,at,JSON.stringify(payload)]
}

text = function (t)
{
    return {type:'text',text:t}
}

reasoning = function (t)
{
    return {type:'reasoning',text:t}
}

tool = function (name, input, opt = {})
{
    var state, _122_31_, _132_51_

    state = {status:((_122_31_=opt.status) != null ? _122_31_ : 'completed'),input:input}
    if (opt.error !== undefined)
    {
        state.error = {type:'unknown',message:opt.error}
    }
    else if (opt.result !== undefined)
    {
        state.content = [{type:'text',text:opt.result}]
    }
    state.metadata = Object.assign({exit:((_132_51_=opt.exit) != null ? _132_51_ : 0)},opt.metadata)
    return {type:'tool',id:`call_${name}`,name:name,state:state}
}

seedSessions = function (db)
{
    var insert

    insert = db.prepare("INSERT INTO session_v2 (id, project_id, parent_id, title, slug, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    insert.run(A,'proj1',null,'Coco - ocls','witty-knight','/home/kodi/a/coco',BASE,BASE + 60000)
    insert.run('ses_bbbbbbbbbbbbbbbbbbbbbbb2','proj1',null,null,'happy-meadow','/home/kodi/.config',BASE + 120000,BASE + 180000)
    insert.run(C,'proj1',null,'Conny - hyprsession','brave-otter','/home/kodi/s/occ',BASE + 240000,BASE + 300000)
    return insert.run('ses_ddddddddddddddddddddddd4','proj1',A,'Bert - child','quiet-fox','/home/kodi/a/coco',BASE + 360000,BASE + 420000)
}

seedMessages = function (db)
{
    var insert

    insert = db.prepare("INSERT INTO session_message (id, session_id, type, seq, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?, ?, ?)")
    run(insert,msg('m1',A,'user',1,{text:'hello'}))
    run(insert,msg('m2',A,'assistant',2,{agent:'plan',content:[reasoning('thinking about the greeting'),text('hi there'),tool('shell',{command:'ls -la; echo ---; hyprctl version'},{result:"total 48\n---\nHyprland 0.56.2"}),text('done listing')]}))
    run(insert,msg('m3',A,'user',3,{text:'again'}))
    run(insert,msg('m4',A,'assistant',4,{agent:'build',content:[text('first bit'),text('second bit')]}))
    run(insert,msg('m5',A,'assistant',5,{content:[text('no agent field')]}))
    run(insert,msg('m6',A,'assistant',6,{agent:'plan',content:[reasoning('only thinking'),tool('shell',{command:'true'},{result:''}),tool('webfetch',{url:'https://example.invalid'},{error:'StatusCode: non 2xx status code (404)'}),tool('grep',{pattern:'needle'},{status:'running'}),tool('read',{path:'/home/kodi/s/occ/spec.txt'},{result:"name: occ\n",metadata:{truncated:1,outputPath:'/home/kodi/.local/share/opencode/tool-output/tool_abc'}})]}))
    run(insert,msg('m7',A,'synthetic',7,{text:'system note'}))
    run(insert,msg('m8','ses_bbbbbbbbbbbbbbbbbbbbbbb2','idle',1,{outcome:'prompt-input'}))
    run(insert,msg('m9','ses_bbbbbbbbbbbbbbbbbbbbbbb2','user',2,{text:''}))
    run(insert,msg('m10',C,'user',1,{text:'one'}))
    run(insert,msg('m11',C,'assistant',2,{agent:'build',content:[tool('shell',{command:'echo hi'},{result:"hi\n"})]}))
    run(insert,msg('m12',C,'assistant',3,{agent:'build',content:[tool('shell',{command:"cat > x <<'EOF'\nline\nEOF"},{result:''}),text('after the tool')]}))
    return run(insert,msg('m13',C,'assistant',4,{agent:'build',content:[tool('shell',{command:'false'},{result:'boom',exit:42})]}))
}
CONTROL_TITLE = 'Nul\0 in\ttitle'
CONTROL_RESULT = ["<anonymous_script>:1","\0\0\0 \b\x10\0\x040\0\0",'','SyntaxError: Unexpected token \'\\0\', "\\0\\0\\0 \\b\\x10\\0\\040\\0\\0" is not valid JSON','tab\there',"color\x1b[31mred\x1b[39m"].join('\n')
CONTROL_SESSION = 'ses_eeeeeeeeeeeeeeeeeeeeeee5'

seedControlBytes = function (db)
{
    var insertMessage, insertSession, payload

    db.exec(SESSION_DDL)
    db.exec(CHILD_DDL)
    insertSession = db.prepare("INSERT INTO session_v2 (id, project_id, parent_id, title, slug, directory, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    insertSession.run(CONTROL_SESSION,'proj1',null,CONTROL_TITLE,'wild-otter','/home/kodi/s/occ',BASE,BASE + 60000)
    payload = {agent:'build',content:[tool('shell',{command:"printf '\\000'"},{result:CONTROL_RESULT})]}
    insertMessage = db.prepare("INSERT INTO session_message (id, session_id, type, seq, time_created, time_updated, data) VALUES (?, ?, ?, ?, ?, ?, ?)")
    return insertMessage.run('c1',CONTROL_SESSION,'assistant',1,BASE,BASE,JSON.stringify(payload))
}

seedChildren = function (db)
{
    var entry, inbox, pending, state

    pending = db.prepare("INSERT INTO session_pending (id, session_id, type, data, delivery, admitted_seq, time_created) VALUES (?, ?, ?, ?, ?, ?, ?)")
    inbox = db.prepare("INSERT INTO session_inbox (id, session_id, type, payload, delivery, enqueued_seq, time_created) VALUES (?, ?, ?, ?, ?, ?, ?)")
    entry = db.prepare("INSERT INTO instruction_entry (session_id, key, value, removed, time_created, time_updated) VALUES (?, ?, ?, ?, ?, ?)")
    state = db.prepare("INSERT INTO instruction_state (session_id, epoch_start, through_seq, initial_values, current_values) VALUES (?, ?, ?, ?, ?)")
    pending.run('p1',A,'compaction','{}','direct',1,BASE)
    inbox.run('i1',A,'note','{}','direct',1,BASE)
    entry.run(A,'reply','short',0,BASE,BASE)
    state.run(A,0,7,'{}','{}')
    pending.run('p2',C,'compaction','{}','direct',2,BASE)
    inbox.run('i2',C,'note','{}','direct',2,BASE)
    entry.run(C,'reply','terse',0,BASE,BASE)
    return state.run(C,0,4,'{}','{}')
}

seed = function (db)
{
    db.exec(SESSION_DDL)
    db.exec(CHILD_DDL)
    seedSessions(db)
    seedMessages(db)
    return seedChildren(db)
}

build = function (name, fill)
{
    var db, dir, final, staging

    dir = path.join(os.tmpdir(),'occ-fixtures',String(process.pid))
    fs.mkdirSync(dir,{recursive:true})
    final = path.join(dir,name)
    staging = `${final}.building`
    fs.rmSync(staging,{force:true})
    db = new sqlite.DatabaseSync(staging)
    try
    {
        fill(db)
    }
    catch (err)
    {
        throw err
    }
    finally
    {
        db.close()
    }
    fs.renameSync(staging,final)
    return final
}

buildTestDb = function ()
{
    return build('test.db',seed)
}

buildBadSchemaDb = function ()
{
    return build('bad-schema.db',function (db)
    {
        return db.exec("CREATE TABLE session_v3 (id text PRIMARY KEY)")
    })
}

buildMissingColumnDb = function ()
{
    return build('missing-column.db',function (db)
    {
        return db.exec("CREATE TABLE session_v2 (id text PRIMARY KEY, title text, time_created integer NOT NULL)")
    })
}

buildControlBytesDb = function ()
{
    return build('control-bytes.db',seedControlBytes)
}

makeDataHome = function ()
{
    var home, source, target

    source = buildTestDb()
    home = path.join(os.tmpdir(),'occ-data-home',String(process.pid))
    target = path.join(home,'opencode','opencode.db')
    fs.mkdirSync(path.join(home,'opencode'),{recursive:true})
    fs.copyFileSync(source,target)
    return {home:home,dbPath:target}
}
cached = null

fixtures = function ()
{
    if (cached === null)
    {
        cached = {DB_PATH:buildTestDb(),BAD_SCHEMA_DB_PATH:buildBadSchemaDb(),MISSING_COLUMN_DB_PATH:buildMissingColumnDb(),CONTROL_DB_PATH:buildControlBytesDb()}
    }
    return cached
}
export default {
    BASE:BASE,
    CONTROL_TITLE:CONTROL_TITLE,
    CONTROL_RESULT:CONTROL_RESULT,
    CONTROL_SESSION:CONTROL_SESSION,
    countRows:countRows,
    buildTestDb:buildTestDb,
    buildBadSchemaDb:buildBadSchemaDb,
    buildMissingColumnDb:buildMissingColumnDb,
    buildControlBytesDb:buildControlBytesDb,
    makeDataHome:makeDataHome,
    fixtures:fixtures
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2tvZGUvdGVzdC9maXh0dXJlcy9idWlsZC5rb2RlIl0sIm1hcHBpbmdzIjoiOztPQWNPLE9BQU8sS0FBSztPQUNaLEdBQUcsS0FBSztPQUNSLEtBQUssS0FBSztPQUNWLEdBQUcsS0FBSztBQUVmLE9BQU87QUFFUCxjQUFjOzs7Ozs7Ozs7O0FBYWQsWUFBWTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVEWixnQkFDSSxrQkFDQSxrQkFDQSxnQkFDQSxvQkFDQTtBQUdKLElBQUk7QUFDSixJQUFJOztBQUVKOzs7O0lBRUksU0FBUyxhQUFhOzs7O1FBQ2xCLE1BQU0sR0FBRyxxQ0FBcUMsOEJBQThCLElBQUk7Z0JBQy9FLE1BQU8sSUFBSTs7V0FFaEIsT0FBTyxZQUFZOzs7QUFFdkI7O1dBQXNCLEtBQUssSUFBSSxNQUFNLEtBQU07OztBQUUzQzs7OztJQUVJLEtBQUssT0FBTyxNQUFNO1lBQ2pCLEdBQUksVUFBVyxLQUFNLElBQUssR0FBSSxHQUFJLEtBQUssVUFBVTs7O0FBRXREOztZQUFlLEtBQU0sT0FBUSxLQUFNOzs7QUFFbkM7O1lBQW9CLEtBQU0sWUFBYSxLQUFNOzs7QUFFN0M7Ozs7SUFFSSxTQUFRLGtCQUFRLElBQUksNkJBQVMsYUFBYSxNQUFPO1FBSzlDLElBQUksVUFBUzs7UUFDWixNQUFNLFNBQVMsS0FBTSxVQUFXLFFBQVMsSUFBSTs7YUFDekMsSUFBSSxXQUFVOztRQUNsQixNQUFNLFlBQVksS0FBTSxPQUFRLEtBQU0sSUFBSTs7SUFFOUMsTUFBTSxXQUFXLE9BQU8sUUFBUSxnQkFBTSxJQUFJLDJCQUFPLElBQUksSUFBSTtZQUV4RCxLQUFNLE9BQVEsV0FBWSxPQUFRLEtBQUEsS0FBTSxNQUFBOzs7QUFFN0M7Ozs7SUFFSSxTQUFTLEdBQUcsUUFBUTtJQUVwQixPQUFPLElBQUksRUFBRyxRQUFTLEtBQU0sY0FBZSxlQUFnQixvQkFBcUIs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
//# sourceURL=file:///home/kodi/s/occ/kode/test/fixtures/build.kode
