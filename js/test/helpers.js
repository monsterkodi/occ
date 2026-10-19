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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZXMiOlsiLi4vLi4va29kZS90ZXN0L2hlbHBlcnMua29kZSJdLCJtYXBwaW5ncyI6Ijs7O0FBT0E7Ozs7SUFFSSxNQUFNOzs7UUFFRjs7V0FDRTs7UUFDRixNQUFNOztVQUVIOztlQUNELFFBQVEsV0FBWTs7VUFFbkI7O2VBQ0QsUUFBUSxJQUFLOztRQUVoQixpQkFBaUI7O1lBQ2IsTUFBTSxLQUFLLElBQUk7O21CQUNaLFFBQVEsTUFBTzs7ZUFDbkIsUUFBUSxNQUFPLElBQUk7O0lBS3pCLEtBQUs7OztRQUVELEtBQUssTUFBTTs7V0FDVDs7UUFDRixLQUFLLGVBQWU7O0lBU3hCLFFBQVEsTUFBTSxRQUFRO1FBRW5COztlQUNHLFFBQVEsTUFBTzs7V0FDckIsUUFBUSxNQUFPOzs7QUFLbkI7O1FBRU8sUUFBUSxLQUFLOztlQUNWLFFBQVEsUUFBUzs7V0FDdkIsUUFBUSxRQUFTOzs7QUFFckI7O1FBRU8sUUFBUSxLQUFLOztlQUNWLFFBQVEsUUFBUSxRQUFTOztXQUMvQixRQUFRLEtBQU07OztBQU9sQjs7Ozs7O1FBR1EsY0FBVTtnQkFDUCxNQUFPLE1BQU8sTUFBTzs7V0FDdEI7O2dCQUNDLE1BQU8sS0FBTSxNQUFPOzs7O0lBRzNCLE9BQVE7SUFDUixRQUFTO0lBQ1QsV0FBWTtJQUNaLFNBQVUifQ==
//# sourceURL=file://kode/test/helpers.kode
