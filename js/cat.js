var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var cat, mergeTurns

import sessions from "./sessions.js"


mergeTurns = function (blocks)
{
    var block, merged, previous, sameMessage

    merged = []
    var list = _k_.list(blocks)
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        block = list[_a_]
        previous = merged.at(-1)
        sameMessage = previous !== undefined && previous.kind === 'turn' && block.kind === 'turn' && previous.message === block.message
        if (sameMessage)
        {
            previous.text = `${previous.text}\n\n${block.text}`
            continue
        }
        merged.push(Object.assign({},block))
    }
    return merged
}

cat = function (opt)
{
    var database, prefixes, sty, turns, width, _42_28_, _43_22_

    database = opt.db
    prefixes = ((_42_28_=opt.prefixes) != null ? _42_28_ : [])
    width = ((_43_22_=opt.width) != null ? _43_22_ : 80)
    sty = opt.style
    turns = function (blocks)
    {
        var spoken

        spoken = blocks.filter(function (b)
        {
            return b.kind === 'turn'
        })
        return mergeTurns(spoken)
    }
    return sessions(database,prefixes,width,sty,turns)
}
export default cat;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2F0LmpzIiwic291cmNlcyI6WyIuLi9rb2RlL2NhdC5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBZ0JBOzs7O0lBRUk7d0JBRWE7Ozs7UUFFVCxXQUFXLE9BQU8sR0FBRztRQUVyQixjQUNJLGFBQVksYUFDWixTQUFTLFNBQVEsVUFDakIsTUFBTSxTQUFRLFVBQ2QsU0FBUyxZQUFXLE1BQU07WUFFM0I7O1lBQ0MsU0FBUyxVQUFVLFNBQVMsV0FBVyxNQUFNO1lBQzdDOztRQUVKLE9BQU8sS0FBSyxPQUFPLFVBQVc7O1dBRWxDOzs7QUFFSjs7OztJQUVJLFdBQVcsSUFBSTtJQUNmLHFCQUFXLElBQUk7SUFDZixrQkFBUSxJQUFJLDJCQUFRO0lBQ3BCLE1BQU0sSUFBSTtJQUVWOzs7O1FBRUksU0FBUyxPQUFPOzttQkFBYyxFQUFFLFNBQVE7O2VBQ3hDLFdBQVc7O1dBRWYsU0FBUyxTQUFVLFNBQVUsTUFBTyxJQUFLOztlQUV0QyJ9
//# sourceURL=file://kode/cat.kode
