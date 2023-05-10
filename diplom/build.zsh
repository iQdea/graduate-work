#!/bin/zsh

set -xe

docker build \
    --target base_dependencies \
    --cache-from diplom:base_dependencies \
    -t diplom:base_dependencies \
    -f Dockerfile \
    ..

docker build \
    --target dev_dependencies \
    --cache-from diplom:base_dependencies \
    --cache-from diplom:dev_dependencies \
    -t diplom:dev_dependencies \
    -f Dockerfile \
    ..

docker build \
    --target source \
    --cache-from diplom:dev_dependencies \
    --cache-from diplom:source \
    -t diplom:source \
    -f Dockerfile \
    ..

docker build \
    --target lint \
    --cache-from diplom:source \
    --cache-from diplom:lint \
    -t diplom:lint \
    -f Dockerfile \
    ..

docker build \
    --target builder \
    --cache-from diplom:source \
    --cache-from diplom:builder \
    -t diplom:builder \
    -f Dockerfile \
    ..

docker build \
    --target release \
    --cache-from diplom:builder \
    --cache-from diplom:base_dependencies \
    -t diplom:release \
    -f Dockerfile \
    ..
