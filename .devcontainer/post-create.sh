#!/bin/bash
set -e

echo "Installing pnpm..."
corepack enable
corepack prepare pnpm@latest --activate

echo "Installing Moon..."
curl -fsSL https://moonrepo.dev/install/moon.sh | bash
echo 'export PATH="$HOME/.moon/bin:$PATH"' >> ~/.bashrc

echo "Installing just..."
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ~/.local/bin

echo "Installing Node dependencies..."
pnpm install

echo "Installing sqlx-cli..."
cargo install sqlx-cli --no-default-features --features postgres

echo "Dev environment ready!"
