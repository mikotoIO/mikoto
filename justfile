# Run database migrations for superego
migrate:
    cd apps/superego && cargo run --bin migrate

# Create a new migration file
new-migration name:
    #!/usr/bin/env bash
    cd apps/superego/migrations
    timestamp=$(date +"%Y%m%d%H%M%S")
    filename="${timestamp}_{{name}}.sql"
    echo "-- Add migration script here" > "$filename"
    echo "Created migration: $filename"