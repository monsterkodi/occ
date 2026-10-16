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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuanMiLCJzb3VyY2VzIjpbIi4uL2tvZGUvdGVybWluYWwua29kZSJdLCJtYXBwaW5ncyI6Ijs7T0FjTyxHQUFHLEtBQUs7O0FBRWY7Ozs7SUFFSSxLQUFLLEdBQUcsU0FBUyxXQUFZO0lBQzdCLFNBQVMsT0FBTyxNQUFNO0lBQ3RCLE9BQU87OztlQUdHOztZQUNGLE9BQU8sR0FBRyxTQUFTLEdBQUksT0FBUSxFQUFHLE9BQU8sT0FBUTtnQkFDOUMsU0FBUTs7Z0JBQU87O1lBQ2xCLFFBQVEsT0FBTyxTQUFTLE9BQVEsRUFBRztnQkFDaEMsS0FBSyxTQUFTOztnQkFBVzs7OztXQUM5Qjs7UUFDRixNQUFNOzs7O1FBRU4sR0FBRyxVQUFVOztxQkFFakIsS0FBSyxNQUFNLE1BQU0sd0JBQUs7OztBQUUxQjs7OztJQUVJOztlQUFrQixJQUFJLE1BQU07O0lBQzVCOztlQUFnQjs7WUFFaEIsWUFBYSxZQUNiLE1BQU8sTUFDUCxXQUFZOztlQUVUIn0=
//# sourceURL=file://kode/terminal.kode
