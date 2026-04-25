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

# Generate a P-256 VAPID keypair for Web Push. Output is url-safe base64 (no padding).
generate-vapid-keys:
    #!/usr/bin/env bash
    node -e "
    const crypto = require('crypto');
    const kp = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const jwk = kp.privateKey.export({ format: 'jwk' });
    const b64url = (s) => Buffer.from(s, 'base64').toString('base64url');
    const priv = b64url(jwk.d);
    // Uncompressed P-256 public key: 0x04 || X || Y (65 bytes)
    const x = Buffer.from(jwk.x, 'base64');
    const y = Buffer.from(jwk.y, 'base64');
    const pub = Buffer.concat([Buffer.from([0x04]), x, y]).toString('base64url');
    console.log('VAPID_PRIVATE_KEY=' + priv);
    console.log('VAPID_PUBLIC_KEY=' + pub);
    console.log('VAPID_SUBJECT=mailto:admin@example.com');
    "

# Reset Docker services (database, S3, and Redis)
reset:
    #!/usr/bin/env bash
    echo "Stopping Docker services..."
    docker compose down --remove-orphans
    echo "Removing volumes..."
    docker volume rm mikoto_postgresql mikoto_redis 2>/dev/null || true
    rm -rf ./data/rustfs
    echo "Starting Docker services..."
    docker compose up -d
    echo "Docker services reset complete!"

# Reset Docker services (database, S3, and Redis)
reset-dev-env:
    #!/usr/bin/env bash
    echo "Stopping Docker services..."
    docker compose down --remove-orphans
    echo "Removing volumes..."
    docker volume rm mikoto_postgresql mikoto_redis 2>/dev/null || true
    rm -rf ./data/rustfs
    echo "Starting Docker services..."
    docker compose up -d
    echo "Waiting for PostgreSQL to be ready..."
    until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
        sleep 1
    done
    echo "Docker services ready!"
    echo "Creating S3 bucket..."
    docker run --rm --network host --entrypoint sh minio/mc:latest -c '
        for i in $(seq 1 60); do
            if mc alias set local http://localhost:35103 rustfs password >/dev/null 2>&1; then
                mc mb --ignore-existing local/mikoto
                exit 0
            fi
            sleep 1
        done
        echo "Timed out waiting for RustFS" >&2
        exit 1
    '
    echo "Bucket ready!"
    echo "Running migrations..."
    cargo run --bin migrate --manifest-path apps/superego/Cargo.toml
    echo "Migrations complete!"
    echo "Seeding database..."
    cargo run --bin seed --manifest-path apps/superego/Cargo.toml
    echo "Seeding complete!"