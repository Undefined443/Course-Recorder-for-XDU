#!/bin/bash

if ! docker info &> /dev/null; then
    echo "You need to start Docker first."
    exit 1
else
    docker run -it --rm -v "${PWD}":/app/records -v "${PWD}":/root/Downloads undefined443/course:arm64 index.js $1 $2 $3 $4
fi

