var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, isStr: function (o) {return typeof o === 'string' || o instanceof String}, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var COMMANDS, HELP, history, main, run, USAGE

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
USAGE = ['','    occ - list, dump and delete opencode v2 sessions','','    usage:','','      occ ls [sess...]        show session table','      occ cat [sess...]       show session conversation','      occ log [sess...]       show session history including tool calls','      occ shell [sess...]     show shell commands with their output','      occ resume sess         resume a session in opencode','      occ del sess [sess...]  delete sessions, asks for confirmation','','    sess: a fragment of a session id or session title','','    table: id datetime minutes turns title','    ']
HELP = USAGE.join('\n')
COMMANDS = {ls:{run:ls},cat:{run:cat},log:{run:history},shell:{run:shell},resume:{run:resume.resume},del:{run:del,writable:true}}

main = async function (argv)
{
    var command, database, entry, given, handler, ids, out, p, sty, width, writable, _85_30_, _94_39_

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
    writable = ((_85_30_=entry.writable) != null ? _85_30_ : false)
    p = db.resolveDbPath()
    database = writable ? db.openWritable(p) : db.openDb(p)
    try
    {
        width = ((_94_39_=process.stdout.columns) != null ? _94_39_ : 80)
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