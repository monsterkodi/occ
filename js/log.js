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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLmpzIiwic291cmNlcyI6WyIuLi9rb2RlL2xvZy5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7OztBQWFBOzs7O0lBRUksV0FBVyxJQUFJO0lBQ2YscUJBQVcsSUFBSTtJQUNmLGtCQUFRLElBQUksMkJBQVE7SUFDcEIsTUFBTSxJQUFJO0lBRVY7O2VBQXlCOztXQUV6QixTQUFTLFNBQVUsU0FBVSxNQUFPLElBQUs7O2VBRXRDIn0=
//# sourceURL=file:///home/kodi/s/occ/kode/log.kode
