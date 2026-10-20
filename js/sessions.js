var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var renderSessions

import query from "./query.js"

import render from "./render.js"


renderSessions = function (database, prefixes, width, sty, filter)
{
    var body, chunks, head, res, session

    chunks = []
    var list = _k_.list(query.listSessions(database,prefixes))
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        session = list[_a_]
        res = query.getSession(database,session.id)
        head = render.renderSession(res.row,width,sty)
        body = render.renderBlocks(filter(res.blocks),sty)
        chunks.push(body === '' ? head : `${head}\n${body}`)
    }
    return chunks.join('\n\n')
}
export default renderSessions;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbnMuanMiLCJzb3VyY2VzIjpbIi4uL2tvZGUvc2Vzc2lvbnMua29kZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBY0E7Ozs7SUFFSTt3QkFFZSxNQUFNLGFBQWEsU0FBVTs7OztRQUV4QyxNQUFNLE1BQU0sV0FBVyxTQUFVLFFBQVE7UUFFekMsT0FBTyxPQUFPLGNBQWMsSUFBSSxJQUFLLE1BQU87UUFDNUMsT0FBTyxPQUFPLGFBQWEsT0FBTyxJQUFJLFFBQVM7UUFFL0MsT0FBTyxLQUFRLFNBQVEsS0FBUSxVQUFhLFNBQVM7O1dBRXpELE9BQU8sS0FBSzs7ZUFFVCJ9
//# sourceURL=file:///home/kodi/s/occ/kode/sessions.kode
