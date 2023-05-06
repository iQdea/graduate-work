#!/bin/zsh

# Set the number of servers and weights
num_servers=$MY_REPLICAS
total_weight=$((3 * num_servers))
file_name=$MY_FILE
# Calculate the weight for each server
weight_per_server=$((total_weight / num_servers))

# Check if the weight per server is greater than zero
if [[ $weight_per_server -eq 0 ]]; then
    echo "Error: Total weight is less than the number of servers." >&2
    exit 1
fi

# Calculate the remaining weight
remaining_weight=$((total_weight - (weight_per_server * num_servers)))

# Initialize the configuration file
cat << EOF > "$file_name"
upstream app_servers {
EOF

# Loop through each server and add it to the configuration file
for (( i=1; i<=num_servers; i++ )); do
    # Calculate the weight for this server
    if [[ $i -eq $num_servers ]]; then
        # Add the remaining weight to the last server
        server_weight=$((weight_per_server + remaining_weight))
    else
        server_weight=$weight_per_server
    fi

    # Add the server to the configuration file
    cat << EOF >> "$file_name"
    server 172.17.0.1:300$i weight=$server_weight;
EOF
done

cat << EOF >> "$file_name"
}

server {
    location / {
        proxy_pass http://app_servers;
    }
}
EOF
