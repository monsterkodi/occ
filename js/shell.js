var onlyShell, shell, SHELL

import sessions from "./sessions.js"

SHELL = 'shell'

onlyShell = function (blocks)
{
    return blocks.filter(function (b)
    {
        return (b.kind === 'call' || b.kind === 'result' || b.kind === 'exit') && b.name === SHELL
    })
}

shell = function (opt)
{
    var database, prefixes, sty, width, _26_28_, _27_22_

    database = opt.db
    prefixes = ((_26_28_=opt.prefixes) != null ? _26_28_ : [])
    width = ((_27_22_=opt.width) != null ? _27_22_ : 80)
    sty = opt.style
    return sessions(database,prefixes,width,sty,onlyShell)
}
export default shell;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGwuanMiLCJzb3VyY2VzIjpbIi4uL2tvZGUvc2hlbGwua29kZSJdLCJtYXBwaW5ncyI6Ijs7OztBQWVBLFFBQVE7O0FBRVI7O1dBRUksT0FBTzs7Z0JBQ0YsRUFBRSxTQUFRLFVBQVUsRUFBRSxTQUFRLFlBQVksRUFBRSxTQUFRLFdBQVksRUFBRSxTQUFROzs7O0FBRW5GOzs7O0lBRUksV0FBVyxJQUFJO0lBQ2YscUJBQVcsSUFBSTtJQUNmLGtCQUFRLElBQUksMkJBQVE7SUFDcEIsTUFBTSxJQUFJO1dBRVYsU0FBUyxTQUFVLFNBQVUsTUFBTyxJQUFLOztlQUV0QyJ9
//# sourceURL=file://kode/shell.kode
