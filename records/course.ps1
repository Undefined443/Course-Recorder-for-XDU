# Check if Docker is running
docker info *> $null

if (!$?) {
    Write-Output "You need to start Docker first."
    Exit 1
}

docker run -it --rm -v "${PWD}:/app/records" -v "${PWD}:/root/Downloads" ghcr.io/undefined443/course:amd64 index.js $args[0] $args[1] $args[2] $args[3]

