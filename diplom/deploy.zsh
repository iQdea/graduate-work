#!/bin/zsh

set -xe

MY_REPLICAS=4 MY_FILE=nginx.conf zsh nginx.zsh
MY_REPLICAS=4 MY_FILE=docker-compose.replicas.yml zsh replicas.zsh

# Запуск
COMPOSES=('docker-compose.services.yml' 'docker-compose.replicas.yml' 'docker-compose.balancer.yml')

for compose in "${COMPOSES[@]}"; do
    docker-compose -f "$compose" up -d
    if [[ "$compose" != *"balancer"* ]]; then
      sleep 30
    fi
done
