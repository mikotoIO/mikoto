run-core:
    moon :start --query "tag~core-app"
# Run database migrations for superego
migrate:
    cd apps/superego && cargo run --bin migrate

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

# Generate Ed25519 keypair for domain handle verification
generate-handle-keys:
    #!/usr/bin/env bash
    node -e "
    const crypto = require('crypto');
    const kp = crypto.generateKeyPairSync('ed25519');
    const priv = kp.privateKey.export({type:'pkcs8',format:'der'}).subarray(-32);
    const pub = kp.publicKey.export({type:'spki',format:'der'}).subarray(-32);
    console.log('HANDLE_PRIVATE_KEY=' + priv.toString('base64'));
    console.log('HANDLE_PUBLIC_KEY=' + pub.toString('base64'));
    "

# Reset Docker services (database, S3, and Redis)
reset:
    #!/usr/bin/env bash
    echo "Stopping Docker services..."
    docker compose down
    echo "Removing volumes..."
    docker volume rm mikoto_postgresql mikoto_redis mikoto_meilisearch 2>/dev/null || true
    rm -rf ./data/rustfs
    echo "Starting Docker services..."
    docker compose up -d
    echo "Docker services reset complete!"

# Reset Docker services (database, S3, and Redis)
reset-dev-env:
    #!/usr/bin/env bash
    echo "Stopping Docker services..."
    docker compose down
    echo "Removing volumes..."
    docker volume rm mikoto_postgresql mikoto_redis mikoto_meilisearch 2>/dev/null || true
    rm -rf ./data/rustfs
    echo "Starting Docker services..."
    docker compose up -d
    echo "Waiting for PostgreSQL to be ready..."
    until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
        sleep 1
    done
    echo "Docker services ready!"
    echo "Running migrations..."
    cargo run --bin migrate --manifest-path apps/superego/Cargo.toml
    echo "Migrations complete!"
    echo "Seeding database..."
    cargo run --bin seed --manifest-path apps/superego/Cargo.toml
    echo "Seeding complete!"