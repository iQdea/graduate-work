#!/bin/zsh

set -xe

for file in *.yml; do
  if [ -f "$file" ]; then
    for container in $(docker network inspect --format='{{range $i := .Containers}}{{$i.Name}} {{end}}' diplom_default); do
      docker network disconnect diplom_default "$container"
    done
    docker-compose -f "$file" down
  fi
done



