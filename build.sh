docker image rm ghcr.io/undefined443/course:1.1.2-amd64 &> /dev/null
docker build --platform linux/amd64 -t ghcr.io/undefined443/course:1.1.3-amd64 . && \
docker push ghcr.io/undefined443/course:1.1.3-amd64

docker image rm ghcr.io/undefined443/course:1.1.2-arm64 &> /dev/null
docker build --platform linux/arm64 -t ghcr.io/undefined443/course:1.1.3-arm64 . && \
docker push ghcr.io/undefined443/course:1.1.3-arm64
