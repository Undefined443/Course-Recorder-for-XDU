# Check if Docker is running
docker info *> $null
if (!$?) {
    Write-Output "You need to start Docker first."
    Exit 1
}
docker run -it --rm -v "${PWD}:/app/records" -v "${PWD}:/root/Downloads" ghcr.io/undefined443/course:1.1.3-amd64 $args[0] $args[1] $args[2] $args[3]
