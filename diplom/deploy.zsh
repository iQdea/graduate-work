#!/bin/zsh

set -xe

INIT_PWD=$(pwd)

# Запуск
PROJECTS=('services' 'app' 'balancer')
for project in "${PROJECTS[@]}"; do
    cd "$project"
    docker-compose up -d
    if [ "$project" = "services" ]; then
      sleep 30
    fi
    cd "$INIT_PWD"
done
