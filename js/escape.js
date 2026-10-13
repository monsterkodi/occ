var CONTROL, escapeControl

CONTROL = /[\0-\x08\x0b-\x1a\x1c-\x1f\x7f]/g

escapeControl = function (text)
{
    return String(text).replace(CONTROL,function (c)
    {
        return "\\x" + c.charCodeAt(0).toString(16).padStart(2,'0')
    })
}
export default escapeControl;