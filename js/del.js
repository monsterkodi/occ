var AFFIRMATIVE, del, MIN_ARGUMENT, WARNING

import query from "./query.js"

import render from "./render.js"

import db from "./db.js"

WARNING = " DELETE SESSIONS "
MIN_ARGUMENT = 3
AFFIRMATIVE = new Set(['y','yes'])

del = function (opt)
{
    var answer, database, ids, prefixes, question, sessions, sty, table, terminal, tooShort, width, _28_28_, _29_22_, _59_35_

    database = opt.db
    prefixes = ((_28_28_=opt.prefixes) != null ? _28_28_ : [])
    width = ((_29_22_=opt.width) != null ? _29_22_ : 80)
    sty = opt.style
    terminal = opt.io
    if (prefixes.length === 0)
    {
        throw new db.OclsError('del needs at least one session id')
    }
    tooShort = prefixes.filter(function (prefix)
    {
        return prefix.length < MIN_ARGUMENT
    })
    if (tooShort.length > 0)
    {
        throw new db.OclsError(`del needs arguments of at least ${MIN_ARGUMENT} characters: ${tooShort.join(', ')}`)
    }
    if (!terminal.interactive)
    {
        throw new db.OclsError('del needs a terminal to confirm in')
    }
    sessions = query.listSessions(database,prefixes)
    table = sessions.map(function (session)
    {
        return render.renderSession(session,width,sty)
    }).join('\n')
    terminal.write(`${sty.del.warning(WARNING)}\n\n${table}\n\n`)
    question = sty.del.question(' ARE YOU SURE? (yN) ')
    terminal.write(question)
    answer = ((_59_35_=terminal.readAnswer()) != null ? _59_35_ : '')
    answer = answer.trim().toLowerCase()
    if (!AFFIRMATIVE.has(answer))
    {
        terminal.write("\nnothing deleted\n")
        return {deleted:[]}
    }
    ids = sessions.map(function (session)
    {
        return session.id
    })
    query.deleteSessions(database,ids)
    terminal.write(`\ndeleted ${ids.length} session(s)\n`)
    return {deleted:ids}
}
export default del;