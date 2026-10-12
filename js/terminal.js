var createTerminal, readLineFromTty

import fs from 'node:fs'

readLineFromTty = function ()
{
    var buffer, fd, line, read, _34_24_

    fd = fs.openSync('/dev/tty','r')
    buffer = Buffer.alloc(1024)
    line = ''
    try
    {
        while (true)
        {
            read = fs.readSync(fd,buffer,0,buffer.length,null)
            if (read === 0)
            {
                break
            }
            line += buffer.toString('utf8',0,read)
            if (line.includes('\n'))
            {
                break
            }
        }
    }
    catch (err)
    {
        throw err
    }
    finally
    {
        fs.closeSync(fd)
    }
    return ((_34_24_=line.split('\n')[0]) != null ? _34_24_ : '')
}

createTerminal = function (out = process.stdout, interactive = Boolean(process.stdin.isTTY))
{
    var readAnswer, write

    write = function (text)
    {
        return out.write(text)
    }
    readAnswer = function ()
    {
        return readLineFromTty()
    }
    return {interactive:interactive,write:write,readAnswer:readAnswer}
}
export default createTerminal;