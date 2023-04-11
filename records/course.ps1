if (!(docker info)) {
    Write-Error "You need to start Docker first."
    Exit 1
} else {
    docker run -it --rm -v "${PWD}:/app/records" -v "${PWD}:/root/Downloads" undefined443/course:amd64 index.js $args[0] $args[1] $args[2] $args[3]
}

