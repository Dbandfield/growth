#!/usr/bin/env sh

# This has a few useful commands for development

set -Eeuxo pipefail

function build
{
    dir=$(dirname "$0") # this directory
    browserify $dir/scripts/index.js > $dir/scripts/bundle.js
}

function dbuild
{
     dir=$(dirname "$0") # this directory
    browserify --debug $dir/scripts/index.js > $dir/scripts/bundle.js   
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