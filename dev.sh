#!/usr/bin/env sh

# This has a few useful commands for development

set -Eeuxo pipefail

# docker account name
DOCKER_USER=dbandfield
# name of this app
DOCKER_APP=growth
# any tags to qualify app with
# defaults to 'latest'
DOCKER_TAGS=latest

function build
{
    dir=$(dirname "$0") # this directory
    docker build -t $DOCKER_USER/$DOCKER_APP:$DOCKER_TAGS $dir
}

function rebuild
{
    dir=$(dirname "$0") # this directory
    docker build --no-cache -t $DOCKER_USER/$DOCKER_APP:$DOCKER_TAGS $dir
}

function start
{
    docker-compose up
}

function all
{
    build
    start
}


"$@"