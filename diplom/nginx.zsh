#!/bin/zsh

# Set the number of servers
num_servers=$MY_REPLICAS
file_name=$MY_FILE

# Initialize the configuration file
cat << EOF > "$file_name"
upstream app_servers {
EOF

# Loop through each server and add it to the configuration file
for (( i=1; i<=num_servers; i++ )); do
    # Set a random weight for this server between 1 and 10
    server_weight=$((1 + RANDOM % num_servers))

    # Add the server to the configuration file
    cat << EOF >> "$file_name"
    server app-$i:3000 weight=$server_weight;
EOF
done

cat << EOF >> "$file_name"
}

server {
    location / {
        proxy_pass http://app_servers;
    }
}

client_max_body_size 0;
EOF
