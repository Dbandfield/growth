'use strict';

/*
    Functions for loading assets
*/

var checkArguments = require('./gr_arguments.js');

var GLTFLoader = require('./GLTFLoader.js');

module.exports = 
{

    loadGLTF : (function()
    {
        // closure so we don't need to create 
        // the loader more than once
        var loader = new GLTFLoader();

        return function(_args)
        {
            var reqArgs = 
            [
                'filename',
                'onLoading',
                'onSuccess',
                'onFailure'
            ]

            checkArguments(_args, reqArgs);
            
            loader.load(
                _args.filename,
                _args.onSuccess,
                _args.onLoading,
                _args.onFailure
            );
        }
    })()    

}