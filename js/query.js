var _k_ = {isStr: function (o) {return typeof o === 'string' || o instanceof String}, isArr: function (o) {return Array.isArray(o)}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, isObj: function (o) {return !(o == null || typeof o != 'object' || o.constructor.name !== 'Object')}, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var CHILD_FILTER, commandOf, deleteSessions, getSession, ID_MATCH, likeEscape, listSessions, MESSAGE_SELECT, normalize, ORDER, resolveOne, resultOf, SELECT, TITLE_MATCH, toBlocks

import db from "./db.js"

SELECT = `SELECT
  s.id,
  s.title,
  s.directory,
  s.time_created,
  s.time_updated,
  coalesce(
    (
      SELECT max(m.time_created)
      FROM session_message m
      WHERE m.session_id = s.id
    ),
    s.time_updated
  ) AS time_last,
  (
    SELECT count(*)
    FROM session_message m
    WHERE m.session_id = s.id
      AND m.type = 'user'
      AND coalesce(json_extract(m.data, '$.text'), '') <> ''
  ) AS turns
FROM session_v2 s`
CHILD_FILTER = 's.parent_id IS NULL'
ORDER = 'ORDER BY time_last ASC, s.time_created ASC, s.id ASC'
MESSAGE_SELECT = `SELECT seq, type, data
FROM session_message
WHERE session_id = ?
ORDER BY seq ASC`

normalize = function (prefix)
{
    if (prefix.startsWith('ses_'))
    {
        return prefix.slice(4)
    }
    else
    {
        return prefix
    }
}

likeEscape = function (text)
{
    return text.replace(/[\\%_]/g,function (c)
    {
        return "\\" + c
    })
}
ID_MATCH = "s.id LIKE 'ses_' || ? || '%' ESCAPE '\\'"
TITLE_MATCH = "lower(coalesce(s.title, '')) LIKE '%' || ? || '%' ESCAPE '\\'"

resolveOne = function (database, prefix)
{
    var byId, byTitle, needle, stmt

    needle = likeEscape(normalize(prefix))
    stmt = database.prepare(`${SELECT} WHERE ${ID_MATCH} AND ${CHILD_FILTER}`)
    byId = stmt.all(needle)
    if (byId.length > 1)
    {
        throw new db.OclsError(`prefix \"${prefix}\" matches ${byId.length} sessions, use 6 or more characters`)
    }
    if (byId.length === 1)
    {
        return byId
    }
    stmt = database.prepare(`${SELECT} WHERE ${TITLE_MATCH} AND ${CHILD_FILTER} ${ORDER}`)
    byTitle = stmt.all(needle)
    if (byTitle.length === 0)
    {
        throw new db.OclsError(`no session matches \"${prefix}\"`)
    }
    return byTitle
}

commandOf = function (input)
{
    var cmd

    cmd = (input != null ? input.command : undefined)
    if (_k_.isStr(cmd))
    {
        return cmd
    }
    return JSON.stringify((input != null ? input : null),null,2)
}

resultOf = function (state)
{
    var content, error, texts, _113_24_

    error = (state != null ? (_113_24_=state.error) != null ? _113_24_.message : undefined : undefined)
    if (_k_.isStr(error))
    {
        return error
    }
    content = (state != null ? state.content : undefined)
    if (!(_k_.isArr(content)))
    {
        return ''
    }
    texts = content.filter(function (c)
    {
        return c && c.type === 'text' && _k_.isStr(c.text)
    })
    return texts.map(function (c)
    {
        return c.text
    }).join('\n')
}

toBlocks = function (data, type, message, blocks)
{
    var agent, code, content, flush, name, part, result, text, _143_23_, _164_25_, _170_41_, _179_38_, _179_48_, _179_61_, _181_25_, _181_35_

    if (type === 'user')
    {
        text = _k_.isStr(data.text) ? data.text : ''
        if (text !== '')
        {
            blocks.push({kind:'turn',role:'user',agent:null,text:text,message:message})
        }
        return
    }
    agent = ((_143_23_=data.agent) != null ? _143_23_ : null)
    content = _k_.isArr(data.content) ? data.content : []
    text = ''
    flush = function ()
    {
        if (text === '')
        {
            return
        }
        blocks.push({kind:'turn',role:'agent',agent:agent,text:text,message:message})
        return text = ''
    }
    var list = _k_.list(content)
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        part = list[_a_]
        if (!part || !(_k_.isObj(part)))
        {
            continue
        }
        if (part.type === 'text' && _k_.isStr(part.text))
        {
            text = text === '' ? part.text : `${text}\n\n${part.text}`
            continue
        }
        if (part.type !== 'tool')
        {
            continue
        }
        flush()
        name = ((_164_25_=part.name) != null ? _164_25_ : 'tool')
        blocks.push({kind:'call',name:name,agent:agent,command:commandOf((part.state != null ? part.state.input : undefined))})
        result = resultOf(part.state)
        if (result !== '')
        {
            blocks.push({kind:'result',name:name,text:result,outputPath:((_179_61_=((_179_38_=part.state) != null ? (_179_48_=_179_38_.metadata) != null ? _179_48_.outputPath : undefined : undefined)) != null ? _179_61_ : null)})
        }
        code = ((_181_25_=part.state) != null ? (_181_35_=_181_25_.metadata) != null ? _181_35_.exit : undefined : undefined)
        if (_k_.isNum(code) && code !== 0)
        {
            blocks.push({kind:'exit',name:name,code:code})
        }
    }
    return flush()
}

listSessions = function (database, prefixes = [])
{
    var found, prefix, row, rows, seen, stmt

    if (prefixes.length === 0)
    {
        stmt = database.prepare(`${SELECT} WHERE ${CHILD_FILTER} ${ORDER}`)
        return stmt.all()
    }
    seen = new Set()
    found = []
    var list = _k_.list(prefixes)
    for (var _b_ = 0; _b_ < list.length; _b_++)
    {
        prefix = list[_b_]
        rows = resolveOne(database,prefix)
        var list1 = _k_.list(rows)
        for (var _c_ = 0; _c_ < list1.length; _c_++)
        {
            row = list1[_c_]
            if (!seen.has(row.id))
            {
                seen.add(row.id)
                found.push(row)
            }
        }
    }
    return found
}

getSession = function (database, id)
{
    var blocks, message, messages, row, rows, stmt

    stmt = database.prepare(`${SELECT} WHERE s.id = ?`)
    rows = stmt.all(id)
    if (rows.length === 0)
    {
        throw new db.OclsError(`no session matches \"${id}\"`)
    }
    row = rows[0]
    blocks = []
    messages = database.prepare(MESSAGE_SELECT).all(id)
    var list = _k_.list(messages)
    for (var _d_ = 0; _d_ < list.length; _d_++)
    {
        message = list[_d_]
        toBlocks(JSON.parse(message.data),message.type,message.seq,blocks)
    }
    return {row:row,blocks:blocks}
}

deleteSessions = function (database, ids)
{
    var id, remove

    remove = database.prepare("DELETE FROM session_v2 WHERE id = ?")
    database.exec('BEGIN')
    try
    {
        var list = _k_.list(ids)
        for (var _e_ = 0; _e_ < list.length; _e_++)
        {
            id = list[_e_]
            remove.run(id)
        }
        return database.exec('COMMIT')
    }
    catch (e)
    {
        database.exec('ROLLBACK')
        throw e
    }
}
export default {
    listSessions:listSessions,
    getSession:getSession,
    deleteSessions:deleteSessions
}