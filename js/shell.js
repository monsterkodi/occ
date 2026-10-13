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