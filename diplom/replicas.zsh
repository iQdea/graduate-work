#!/bin/zsh

replicas=$MY_REPLICAS
output_file=$MY_FILE

service_template="
  app-%d:
    image: diplom
    container_name: app-replica-%d
    env_file:
      - app.env
"

echo "version: '3.9'" > "$output_file"
echo "services:" >> "$output_file"
for (( i=1; i<=replicas; i++ ))
do
  echo -n "$service_template" | \
    sed "s/%d/$i/g" >> "$output_file"
done

echo "networks:
  diplom_default:
    name: diplom_default
    external: true" >> "$output_file"
