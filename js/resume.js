var personaOf, PERSONAS, resume, startOpencode

import cp from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import query from "./query.js"

import db from "./db.js"

PERSONAS = {'.config':'sepp'}

personaOf = function (directory)
{
    var name, _27_19_

    name = path.basename(directory)
    return ((_27_19_=PERSONAS[name]) != null ? _27_19_ : name.toLowerCase())
}

startOpencode = function (opt)
{
    var args, command, cwd, env

    command = opt.command
    args = opt.args
    cwd = opt.cwd
    env = opt.env
    process.on('SIGINT',function ()
    {})
    return new Promise(function (resolve, reject)
    {
        var child

        child = cp.spawn(command,args,{cwd:cwd,env:env,stdio:'inherit'})
        child.on('error',function (e)
        {
            return reject(new db.OclsError(`cannot start ${command}: ${e.message}`))
        })
        return child.on('close',function (code)
        {
            return resolve((code != null ? code : 0))
        })
    })
}

resume = async function (opt)
{
    var database, launch, prefix, prefixes, session, sessions, terminal, _54_28_, _56_24_

    database = opt.db
    prefixes = ((_54_28_=opt.prefixes) != null ? _54_28_ : [])
    terminal = opt.io
    launch = ((_56_24_=opt.launch) != null ? _56_24_ : startOpencode)
    if (prefixes.length !== 1)
    {
        if (prefixes.length === 0)
        {
            throw new db.OclsError('resume needs exactly one session id')
        }
        throw new db.OclsError(`resume takes one session id, got ${prefixes.length}`)
    }
    if (!terminal.interactive)
    {
        throw new db.OclsError('resume needs a terminal to hand over to')
    }
    prefix = prefixes[0]
    sessions = query.listSessions(database,prefixes)
    if (sessions.length > 1)
    {
        throw new db.OclsError(`\"${prefix}\" matches ${sessions.length} sessions, resume takes one`)
    }
    session = sessions[0]
    if (!fs.existsSync(session.directory))
    {
        throw new db.OclsError(`the directory of \"${prefix}\" is gone: ${session.directory}`)
    }
    return await launch({command:'opencode',args:['--session',session.id],cwd:session.directory,env:Object.assign({},process.env,{OPENCODE_PERSONA:personaOf(session.directory)})})
}
export default {
    resume:resume,
    personaOf:personaOf
}