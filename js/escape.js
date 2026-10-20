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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNjYXBlLmpzIiwic291cmNlcyI6WyIuLi9rb2RlL2VzY2FwZS5rb2RlIl0sIm1hcHBpbmdzIjoiOztBQWFBLFVBQVU7O0FBRVY7O1dBRUksT0FBTyxNQUFNLFFBQVE7O2VBQWdCLFFBQVEsRUFBRSxXQUFXLEdBQUcsU0FBUyxJQUFJLFNBQVMsRUFBRzs7O2VBRW5GIn0=
//# sourceURL=file:///home/kodi/s/occ/kode/escape.kode
