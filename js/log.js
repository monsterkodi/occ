var log

import sessions from "./sessions.js"


log = function (opt)
{
    var database, everyBlock, prefixes, sty, width, _17_28_, _18_22_

    database = opt.db
    prefixes = ((_17_28_=opt.prefixes) != null ? _17_28_ : [])
    width = ((_18_22_=opt.width) != null ? _18_22_ : 80)
    sty = opt.style
    everyBlock = function (blocks)
    {
        return blocks
    }
    return sessions(database,prefixes,width,sty,everyBlock)
}
export default log;