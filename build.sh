docker image rm undefined443/course:amd64
docker build --platform linux/amd64 -t undefined443/course:amd64 . && \
docker push undefined443/course:amd64

docker image rm undefined443/course:arm64
docker build --platform linux/arm64 -t undefined443/course:arm64 . && \
docker push undefined443/course:arm64
