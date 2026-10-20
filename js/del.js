var AFFIRMATIVE, del, MIN_ARGUMENT, WARNING

import query from "./query.js"

import render from "./render.js"

import db from "./db.js"

WARNING = " DELETE SESSIONS "
MIN_ARGUMENT = 3
AFFIRMATIVE = new Set(['y','yes'])

del = function (opt)
{
    var answer, database, ids, prefixes, question, sessions, sty, table, terminal, tooShort, width, _27_28_, _28_22_, _52_35_

    database = opt.db
    prefixes = ((_27_28_=opt.prefixes) != null ? _27_28_ : [])
    width = ((_28_22_=opt.width) != null ? _28_22_ : 80)
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
    answer = ((_52_35_=terminal.readAnswer()) != null ? _52_35_ : '')
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsLmpzIiwic291cmNlcyI6WyIuLi9rb2RlL2RlbC5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQWlCQSxVQUFVO0FBRVYsZUFBZTtBQUVmLGtCQUFrQixLQUFLLElBQUs7O0FBRTVCOzs7O0lBRUksV0FBVyxJQUFJO0lBQ2YscUJBQVcsSUFBSTtJQUNmLGtCQUFRLElBQUksMkJBQVE7SUFDcEIsTUFBTSxJQUFJO0lBQ1YsV0FBVyxJQUFJO1FBRVosU0FBUyxXQUFVOztRQUNsQixVQUFVLEdBQUcsVUFBVTs7SUFFM0IsV0FBVyxTQUFTOztlQUFtQixPQUFPLFNBQVM7O1FBRXBELFNBQVMsU0FBUzs7UUFDakIsVUFBVSxHQUFHLDZDQUE2Qyw0QkFBNEIsU0FBUyxLQUFLOztTQUVqRyxTQUFTOztRQUNaLFVBQVUsR0FBRyxVQUFVOztJQUUzQixXQUFXLE1BQU0sYUFBYSxTQUFVO0lBRXhDLFFBQVEsU0FBUzs7ZUFBaUIsT0FBTyxjQUFjLFFBQVMsTUFBTztPQUFNLEtBQUs7SUFFbEYsU0FBUyxTQUFTLElBQUksSUFBSSxRQUFRLGVBQWU7SUFFakQsV0FBVyxJQUFJLElBQUksU0FBUztJQUM1QixTQUFTLE1BQU07SUFFZixtQkFBUyxTQUFTLGtDQUFlO0lBQ2pDLFNBQVMsT0FBTyxPQUFPO1NBRWhCLFlBQVksSUFBSTs7UUFDbkIsU0FBUyxNQUFNO2dCQUNaOztJQUVQLE1BQU0sU0FBUzs7ZUFBaUIsUUFBUTs7SUFFeEMsTUFBTSxlQUFlLFNBQVU7SUFFL0IsU0FBUyxtQkFBbUIsSUFBSTtZQUVoQyxRQUFTOztlQUVOIn0=
//# sourceURL=file:///home/kodi/s/occ/kode/del.kode
