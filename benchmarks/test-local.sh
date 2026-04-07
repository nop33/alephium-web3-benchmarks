#!/usr/bin/env bash
# Builds and publishes all packages to a local Verdaccio registry.
#
# Usage: bash benchmarks/test-local.sh
#
# Then in benchmark apps:
#   echo "@alephium:registry=http://localhost:4873" > .npmrc
#   pnpm install
#
# Prerequisites: Docker

set -euo pipefail

MONOREPO="$(cd "$(dirname "$0")/../alephium-web3" && pwd)"
REGISTRY="http://localhost:4873"
CONTAINER_NAME="verdaccio-test"

echo "========================================"
echo "  Publish to Local Registry"
echo "========================================"
echo ""

# ------------------------------------------
# Step 1: Start Verdaccio via Docker
# ------------------------------------------
echo "--- Starting Verdaccio ---"
if curl -s "$REGISTRY" > /dev/null 2>&1; then
  echo "Already running at $REGISTRY"
else
  docker run -d --name "$CONTAINER_NAME" -p 4873:4873 verdaccio/verdaccio > /dev/null 2>&1 || {
    docker start "$CONTAINER_NAME" > /dev/null 2>&1 || {
      echo "Failed to start Verdaccio. Is Docker running?"
      exit 1
    }
  }
  for i in $(seq 1 15); do
    curl -s "$REGISTRY" > /dev/null 2>&1 && break
    sleep 1
  done
  if ! curl -s "$REGISTRY" > /dev/null 2>&1; then
    echo "Failed to start Verdaccio"
    exit 1
  fi
  echo "Started at $REGISTRY"
fi
echo ""

# ------------------------------------------
# Step 2: Get auth token
# ------------------------------------------
echo "--- Authenticating ---"
TOKEN=$(curl -s -XPUT -H "Content-Type: application/json" \
  "$REGISTRY/-/user/org.couchdb.user:test" \
  -d '{"name":"test","password":"test","email":"test@test.com"}' | node -e "
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    console.log(data.token || '');
  " 2>/dev/null)

# Write .npmrc in monorepo root so pnpm publish picks it up
NPMRC_FILE="$MONOREPO/.npmrc"
if [ -f "$NPMRC_FILE" ]; then
  cp "$NPMRC_FILE" "$MONOREPO/.npmrc.backup"
fi
echo "registry=$REGISTRY" > "$NPMRC_FILE"
echo "//localhost:4873/:_authToken=$TOKEN" >> "$NPMRC_FILE"
echo "Done"
echo ""

# ------------------------------------------
# Step 3: Bump version (so we can republish)
# ------------------------------------------
echo "--- Bumping version ---"
cd "$MONOREPO"
VERSION="3.0.0-test.$(date +%s)"
pnpm --stream -r exec npm version "$VERSION" --no-git-tag-version 2>&1 | tail -1
echo "Version: $VERSION"
echo ""

# ------------------------------------------
# Step 4: Build all packages
# ------------------------------------------
echo "--- Building ---"
pnpm run build 2>&1 | tail -3
echo ""

# ------------------------------------------
# Step 5: Publish all packages
# ------------------------------------------
echo "--- Publishing ---"
PACKAGES=(
  "packages/web3"
  "packages/web3-wallet"
  "packages/web3-test"
  "packages/walletconnect"
  "packages/web3-react"
  "packages/get-extension-wallet"
  "packages/cli"
)

for pkg in "${PACKAGES[@]}"; do
  cd "$MONOREPO/$pkg"
  PKG_NAME=$(node -e "console.log(require('./package.json').name)")
  PKG_VERSION=$(node -e "console.log(require('./package.json').version)")
  echo "  $PKG_NAME@$PKG_VERSION"
  pnpm publish --registry "$REGISTRY" --tag test --access public --no-git-checks 2>&1 || echo "    (failed — see error above)"
done

echo ""
echo "========================================"
echo "  Done! Registry: $REGISTRY"
echo "========================================"
echo ""
echo "To use in a project:"
echo "  echo '@alephium:registry=http://localhost:4873' > .npmrc"
echo "  pnpm add @alephium/web3@$VERSION @alephium/web3-wallet@$VERSION"
echo ""
# Restore original .npmrc if backed up
if [ -f "$MONOREPO/.npmrc.backup" ]; then
  mv "$MONOREPO/.npmrc.backup" "$NPMRC_FILE"
  echo "(Restored original .npmrc)"
else
  rm -f "$NPMRC_FILE"
fi

echo ""
echo "Cleanup:"
echo "  docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
