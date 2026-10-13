var ls, renderRows

import query from "./query.js"

import render from "./render.js"


renderRows = function (sessions, width, sty, groupByDate)
{
    var previous, rows

    previous = null
    rows = sessions.map(function (session)
    {
        var day, repeatDate, _23_46_

        day = render.dayKey(((_23_46_=session.time_last) != null ? _23_46_ : session.time_updated))
        repeatDate = groupByDate && day === previous
        previous = day
        return render.renderSession(session,width,sty,{repeatDate:repeatDate})
    })
    return rows.join('\n')
}

ls = function (opt)
{
    var database, prefixes, sty, width, _33_28_, _34_22_

    database = opt.db
    prefixes = ((_33_28_=opt.prefixes) != null ? _33_28_ : [])
    width = ((_34_22_=opt.width) != null ? _34_22_ : 80)
    sty = opt.style
    return renderRows(query.listSessions(database,prefixes),width,sty,prefixes.length === 0)
}
export default ls;