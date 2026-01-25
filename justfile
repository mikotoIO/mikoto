run-core:
    moon :start --query "tag~core-app"
# Run database migrations for superego
migrate:
    cd apps/superego && cargo run --bin migrate

# Dump the OpenAPI schema from superego
dump-api:
    cd apps/superego && cargo run --bin dump_api

# Seed the database with placeholder data for development
seed:
    cd apps/superego && cargo run --bin seed

# Create a new migration file
new-migration name:
    #!/usr/bin/env bash
    cd apps/superego/migrations
    timestamp=$(date +"%Y%m%d%H%M%S")
    filename="${timestamp}_{{name}}.sql"
    echo "-- Add migration script here" > "$filename"
    echo "Created migration: $filename"

# Reset Docker services (database, S3, and Redis)
docker-start:
    echo "Starting Docker services..."
    docker compose up -d
    echo "Docker started!"

# Reset Docker services (database, S3, and Redis)
reset-dev-env:
    #!/usr/bin/env bash
    echo "Stopping Docker services..."
    docker compose down
    echo "Removing volumes..."
    docker volume rm mikoto_postgresql mikoto_redis mikoto_meilisearch 2>/dev/null || true
    rm -rf ./data/minio
    echo "Starting Docker services..."
    docker compose up -d
    echo "Docker services reset complete!"
    cd apps/superego && cargo run --bin seed
    echo "Seeding complete!"