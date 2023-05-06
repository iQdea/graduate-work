#!/bin/zsh

set -xe

MY_REPLICAS=4 MY_FILE=nginx.conf zsh nginx.zsh
MY_REPLICAS=4 MY_FILE=docker-compose.replicas.yml zsh replicas.zsh

# Запуск
COMPOSES=('docker-compose.yml' 'docker-compose.replicas.yml')

for compose in "${COMPOSES[@]}"; do
    docker-compose -f "$compose" up -d
    if [[ "$compose" != *"replicas"* ]]; then
      sleep 30
    fi
done
