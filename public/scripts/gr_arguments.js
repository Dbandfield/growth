'use strict';

/* 
    This function checks to see if the supplied object
    has the properties listed in the supplied array.

    If arguments are passed as an object, that object can
    then be checked to see if the right arguments are being supplied,
    hopefully avoiding annoying errors later on.
*/

module.exports = function checkArgs(_obj, _argArr)
{
    var ok = true;
    if(!Array.isArray(_argArr))
    {
        console.error('CHECK_ARGS: arguments to check are not array');
        ok = false;
    }

    for(var i in _argArr)
    {
        if(typeof(_argArr[i]) != "string")
        {
            console.error('CHECK_ARGS: argument to check is not string');
            ok = false;
        }

        if(!_obj.hasOwnProperty(_argArr[i]))
        {
            ok = false;
        }
    }

    if(!ok) throw "Check Arguments: Arguments Bad";
}

