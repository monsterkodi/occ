var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, isStr: function (o) {return typeof o === 'string' || o instanceof String}, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var COMMANDS, HELP, history, main, run

import db from "./db.js"

import style from "./style.js"

import terminal from "./terminal.js"

import ls from "./ls.js"

import cat from "./cat.js"

import log from "./log.js"

import shell from "./shell.js"

import del from "./del.js"

import resume from "./resume.js"

history = log
HELP = `
occ - list, dump and delete opencode v2 sessions

usage:

  occ ls [sess...]        show session table
  occ cat [sess...]       show session conversation
  occ log [sess...]       show session history including tool calls
  occ shell [sess...]     show shell commands with their output
  occ resume sess         resume a session in opencode
  occ del sess [sess...]  delete sessions, asks for confirmation

sess: a fragment of a session id or session title

table: id datetime minutes turns title
`
COMMANDS = {ls:{run:ls},cat:{run:cat},log:{run:history},shell:{run:shell},resume:{run:resume.resume},del:{run:del,writable:true}}

main = async function (argv)
{
    var command, database, entry, given, handler, ids, out, p, sty, width, writable, _70_30_, _76_39_

    given = argv[0]
    ids = argv.slice(1)
    if (_k_.in(given,['-h','--help','help']))
    {
        process.stdout.write(`${HELP}\n`)
        return 0
    }
    command = argv.length === 0 ? 'ls' : given
    entry = COMMANDS[command]
    if (_k_.empty(entry))
    {
        process.stderr.write(`unknown command \"${command}\"\n\n${HELP}\n`)
        return 1
    }
    handler = entry.run
    writable = ((_70_30_=entry.writable) != null ? _70_30_ : false)
    p = db.resolveDbPath()
    database = writable ? db.openWritable(p) : db.openDb(p)
    try
    {
        width = ((_76_39_=process.stdout.columns) != null ? _76_39_ : 80)
        sty = style.createStyle(Boolean(process.stdout.isTTY) && !process.env.NO_COLOR)
        out = await handler({db:database,prefixes:ids,width:width,style:sty,io:terminal()})
        if (_k_.isStr(out) && !_k_.empty(out))
        {
            process.stdout.write(`${out}\n`)
        }
        if (_k_.isNum(out))
        {
            return out
        }
        return 0
    }
    catch (err)
    {
        database.close()
        throw err
    }
    database.close()
    return 0
}

run = async function (argv)
{
    try
    {
        return process.exitCode = await main(argv)
    }
    catch (e)
    {
        if (e instanceof db.OclsError)
        {
            process.stderr.write(`occ: ${e.message}\n`)
            return process.exitCode = 1
        }
        else
        {
            throw e
        }
    }
}
export default {
    main:main,
    run:run
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2NjLmpzIiwic291cmNlcyI6WyIuLi9rb2RlL29jYy5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLFVBQVU7QUFFVixPQUFPOzs7Ozs7Ozs7Ozs7Ozs7O0FBbUJQLFlBQ0ksSUFBSSxJQUFLLElBQ1QsS0FBSyxJQUFLLEtBQ1YsS0FBSyxJQUFLLFNBQ1YsT0FBTyxJQUFLLE9BQ1osUUFBUSxJQUFLLE9BQU8sUUFDcEIsS0FDSSxJQUFLLElBQ0wsU0FBVTs7QUFFbEI7Ozs7SUFFSSxRQUFRLEtBQUs7SUFDYixNQUFNLEtBQUssTUFBTTtlQUVkLE9BQVUsS0FBSyxTQUFTOztRQUN2QixRQUFRLE9BQU8sU0FBUztlQUN0Qjs7SUFFTixVQUFhLEtBQUssV0FBVSxJQUFPLE9BQVU7SUFFN0MsUUFBUSxTQUFTO2tCQUVSOztRQUNMLFFBQVEsT0FBTywyQkFBMkIsZ0JBQWdCO2VBQ3hEOztJQUVOLFVBQVUsTUFBTTtJQUNoQixxQkFBVyxNQUFNLDhCQUFXO0lBRTVCLElBQUksR0FBRztJQUNQLFdBQWMsV0FBYyxHQUFHLGFBQWEsS0FBUSxHQUFHLE9BQU87OztRQUcxRCxrQkFBUSxRQUFRLE9BQU8sNkJBQVU7UUFDakMsTUFBTSxNQUFNLFlBQVksUUFBUSxRQUFRLE9BQU8sV0FBZSxRQUFRLElBQUk7UUFFMUUsWUFBTyxTQUFTLEdBQUksU0FBVSxTQUFVLElBQUssTUFBQSxNQUFPLE1BQU8sSUFBSyxHQUFJO3NCQUVqRSxtQkFBeUI7O1lBQVMsUUFBUSxPQUFPLFNBQVM7O3NCQUUxRDs7bUJBQWtCOztlQUNuQjs7V0FDQTs7UUFDRixTQUFTO1FBQ1QsTUFBTTs7SUFFVixTQUFTO1dBQ1Q7OztBQUVKOzs7O2VBR1EsUUFBUSxpQkFBYSxLQUFLOztXQUN4Qjs7WUFDQyxhQUFhLEdBQUc7O1lBQ2YsUUFBUSxPQUFPLGNBQWMsRUFBRTttQkFDL0IsUUFBUSxXQUFXOzs7O1lBRW5CLE1BQU07Ozs7O0lBR2QsS0FBTTtJQUNOLElBQUsifQ==
//# sourceURL=file://kode/occ.kode
