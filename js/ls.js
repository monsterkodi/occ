var ls, renderRows

import query from "./query.js"

import render from "./render.js"


renderRows = function (sessions, width, sty, groupByDate)
{
    var previous, rows

    previous = null
    rows = sessions.map(function (session)
    {
        var day, repeatDate, _19_46_

        day = render.dayKey(((_19_46_=session.time_last) != null ? _19_46_ : session.time_updated))
        repeatDate = groupByDate && day === previous
        previous = day
        return render.renderSession(session,width,sty,{repeatDate:repeatDate})
    })
    return rows.join('\n')
}

ls = function (opt)
{
    var database, prefixes, sty, width, _29_28_, _30_22_

    database = opt.db
    prefixes = ((_29_28_=opt.prefixes) != null ? _29_28_ : [])
    width = ((_30_22_=opt.width) != null ? _30_22_ : 80)
    sty = opt.style
    return renderRows(query.listSessions(database,prefixes),width,sty,prefixes.length === 0)
}
export default ls;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHMuanMiLCJzb3VyY2VzIjpbIi4uL2tvZGUvbHMua29kZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWFBOzs7O0lBRUksV0FBVztJQUVYLE9BQU8sU0FBUzs7OztRQUNaLE1BQU0sT0FBTyxpQkFBTyxRQUFRLCtCQUFZLFFBQVE7UUFDaEQsYUFBYSxlQUFnQixRQUFPO1FBQ3BDLFdBQVc7ZUFDWCxPQUFPLGNBQWMsUUFBUyxNQUFPLEtBQU0sV0FBQTs7V0FFL0MsS0FBSyxLQUFLOzs7QUFFZDs7OztJQUVJLFdBQVcsSUFBSTtJQUNmLHFCQUFXLElBQUk7SUFDZixrQkFBUSxJQUFJLDJCQUFRO0lBQ3BCLE1BQU0sSUFBSTtXQUVWLFdBQVcsTUFBTSxhQUFhLFNBQVUsVUFBVyxNQUFPLElBQUssU0FBUyxXQUFVOztlQUUvRSJ9
//# sourceURL=file://kode/ls.kode
