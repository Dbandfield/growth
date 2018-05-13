#!/usr/bin/env sh

# This has a few useful commands for development

set -x

function build
{
    dir=$(dirname "$0") # this directory
    browserify $dir/scripts/index.js > $dir/scripts/bundle.js
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

"$@"