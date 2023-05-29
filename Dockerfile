# Node Builder
FROM node:alpine AS build
WORKDIR /app/nodejs/
COPY nodejs/package*.json ./
RUN npm ci --registry=https://registry.npmmirror.com

# Python Builder
# FROM python:alpine AS python-builder
RUN apk add --no-cache --update --repository http://mirrors.aliyun.com/alpine/v3.14/main/ \
    python3-dev \
    py3-pip \
    make \
    g++ \
    gcc \
    libc-dev \
    linux-headers \
    libffi-dev \
    openssl-dev
WORKDIR /app/python/
RUN pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ pipenv
COPY python/Pipfile python/Pipfile.lock ./
RUN PIPENV_VENV_IN_PROJECT=1 pipenv --python /usr/bin/python3.10 && pipenv install

# Runtime
FROM node:alpine
RUN apk add --repository http://mirrors.aliyun.com/alpine/v3.14/main/ --no-cache\
    python3 \
    ffmpeg
COPY --from=build /app/nodejs/ /app/nodejs/
COPY --from=build /app/python/ /app/python/
COPY ./ /app/
WORKDIR /app/nodejs/
LABEL org.opencontainers.image.source https://github.com/undefined443/course-recorder-for-xdu
CMD index.js help
