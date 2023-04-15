docker image rm ghcr.io/undefined443/course:amd64
docker build --platform linux/amd64 -t ghcr.io/undefined443/course:amd64 . && \
docker push ghcr.io/undefined443/course:amd64

docker image rm ghcr.io/undefined443/course:arm64
docker build --platform linux/arm64 -t ghcr.io/undefined443/course:arm64 . && \
docker push ghcr.io/undefined443/course:arm64
