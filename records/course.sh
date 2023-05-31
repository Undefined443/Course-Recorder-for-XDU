#!/bin/bash
if ! docker info &> /dev/null; then
    echo "You need to start Docker first."
    exit 1
else
    docker run -it --rm -v "${PWD}:/app/records" -v "${PWD}:/root/Downloads" ghcr.io/undefined443/course:1.1.3-arm64 $1 $2 $3 $4
fi
