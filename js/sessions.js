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