module.exports = function checkArgs(_obj, _argArr)
{
    if(!Array.isArray(_argArr))
    {
        console.error('CHECK_ARGS: arguments to check are not array');
        return false;
    }

    for(var i in _argArr)
    {
        if(typeof(_argArr[i]) != "string")
        {
            console.error('CHECK_ARGS: argument to check is not string');
            return false;
        }

        if(!_obj.hasOwnProperty(_argArr[i]))
        {
            return false;
        }
    }

    return true;
}

