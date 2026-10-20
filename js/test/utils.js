var catching, matches, notMatches, throws


throws = function (fn, match)
{
    var err, ident, ok

    err = null
    try
    {
        fn()
    }
    catch (e)
    {
        err = e
    }
    if (!(err != null))
    {
        return compare('an error','nothing thrown')
    }
    if (!(match != null))
    {
        return compare(err,err)
    }
    if (match instanceof RegExp)
    {
        if (match.test(err.message))
        {
            return compare(match,match)
        }
        return compare(match,err.message)
    }
    ok = false
    try
    {
        ok = match(err)
    }
    catch (classErr)
    {
        ok = err instanceof match
    }
    ident = match.name || 'matcher'
    if (ok)
    {
        return compare(ident,ident)
    }
    return compare(ident,err)
}

matches = function (text, pattern)
{
    if (pattern.test(text))
    {
        return compare(pattern,pattern)
    }
    return compare(pattern,text)
}

notMatches = function (text, pattern)
{
    if (pattern.test(text))
    {
        return compare('no ' + pattern,text)
    }
    return compare(true,true)
}

catching = async function (fn)
{
    var value

    try
    {
        value = await fn()
        return {value:value,error:null}
    }
    catch (e)
    {
        return {value:null,error:e}
    }
}
export default {
    throws:throws,
    matches:matches,
    notMatches:notMatches,
    catching:catching
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2tvZGUvdGVzdC91dGlscy5rb2RlIl0sIm1hcHBpbmdzIjoiOzs7QUFPQTs7OztJQUVJLE1BQU07OztRQUVGOztXQUNFOztRQUNGLE1BQU07O1VBRUg7O2VBQ0QsUUFBUSxXQUFZOztVQUVuQjs7ZUFDRCxRQUFRLElBQUs7O1FBRWhCLGlCQUFpQjs7WUFDYixNQUFNLEtBQUssSUFBSTs7bUJBQ1osUUFBUSxNQUFPOztlQUNuQixRQUFRLE1BQU8sSUFBSTs7SUFLekIsS0FBSzs7O1FBRUQsS0FBSyxNQUFNOztXQUNUOztRQUNGLEtBQUssZUFBZTs7SUFTeEIsUUFBUSxNQUFNLFFBQVE7UUFFbkI7O2VBQ0csUUFBUSxNQUFPOztXQUNyQixRQUFRLE1BQU87OztBQUtuQjs7UUFFTyxRQUFRLEtBQUs7O2VBQ1YsUUFBUSxRQUFTOztXQUN2QixRQUFRLFFBQVM7OztBQUVyQjs7UUFFTyxRQUFRLEtBQUs7O2VBQ1YsUUFBUSxRQUFRLFFBQVM7O1dBQy9CLFFBQVEsS0FBTTs7O0FBT2xCOzs7Ozs7UUFHUSxjQUFVO2dCQUNQLE1BQU8sTUFBTyxNQUFPOztXQUN0Qjs7Z0JBQ0MsTUFBTyxLQUFNLE1BQU87Ozs7SUFHM0IsT0FBUTtJQUNSLFFBQVM7SUFDVCxXQUFZO0lBQ1osU0FBVSJ9
//# sourceURL=file:///home/kodi/s/occ/kode/test/utils.kode
