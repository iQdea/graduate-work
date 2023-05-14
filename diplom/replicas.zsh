#!/bin/zsh

replicas=$MY_REPLICAS
output_file=$MY_FILE

service_template="
  app-%d:
    image: diplom:release
    depends_on:
      app:
        condition: service_completed_successfully
    container_name: app-replica-%d
    env_file:
      - app.env
"

migrate_template="
  app:
    image: diplom:release
    container_name: app-replica-migrate
    env_file:
      - app.env
    command: node ./dist/common/scripts/generate-database.js
"

echo "version: '3.9'" > "$output_file"
echo "services:" >> "$output_file"
echo -n "$migrate_template" >> "$output_file"
for (( i=1; i<=replicas; i++ ))
do
  echo -n "$service_template" | \
    sed "s/%d/$i/g" >> "$output_file"
done

echo "networks:
  diplom_default:
    name: diplom_default
    external: true" >> "$output_file"
