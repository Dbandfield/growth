#!/usr/bin/env sh

# This has a few useful commands for development

set -Eeuxo pipefail

function build
{
    dir=$(dirname "$0") # this directory
    browserify $dir/app/scripts/index.js > $dir/app/scripts/bundle.js
}

function dbuild
{
     dir=$(dirname "$0") # this directory
    browserify --debug $dir/app/scripts/index.js > $dir/app/scripts/bundle.js   
}

function server
{
    dir=$(dirname "$0") # this directory
    cd $dir
    python -m http.server
}

function run
{
    build
    server
}

function drun
{
    dbuild
    server
}

function gitClean
{
    git branch --merged master | grep -v '^[ *]*master$' | xargs -r git branch -d
}

"$@"