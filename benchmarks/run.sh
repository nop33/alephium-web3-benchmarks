#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB3_ROOT="$SCRIPT_DIR/../alephium-web3"
WEB3_PKG="$WEB3_ROOT/packages/web3"
RESULTS="$SCRIPT_DIR/results"

mkdir -p "$RESULTS"

echo "========================================"
echo "  Alephium web3 Benchmark Suite"
echo "========================================"
echo ""

# ------------------------------------------
# Step 0: Build @alephium/web3 and pack tarball
# ------------------------------------------
echo "--- Step 0: Building @alephium/web3 and packing tarball ---"
cd "$WEB3_ROOT"
pnpm --filter @alephium/web3 run build
cd "$WEB3_PKG"
rm -f alephium-web3-*.tgz
pnpm pack 2>&1 | tail -1
TARBALL_NAME=$(ls alephium-web3-*.tgz)
TARBALL_PATH="$WEB3_PKG/$TARBALL_NAME"
TARBALL_SIZE=$(wc -c < "$TARBALL_PATH" | tr -d ' ')
echo "Tarball: $TARBALL_NAME ($TARBALL_SIZE bytes)"
echo ""

# ------------------------------------------
# Step 1: size-limit
# ------------------------------------------
echo "--- Step 1: size-limit ---"
cd "$WEB3_PKG"
if npx size-limit --json > "$RESULTS/size-limit.json" 2>/dev/null; then
  echo "size-limit results:"
  node -e "
    const r = JSON.parse(require('fs').readFileSync('$RESULTS/size-limit.json', 'utf8'));
    r.forEach(e => console.log('  ' + e.name + ': ' + (e.size / 1024).toFixed(1) + ' kB'));
  "
else
  echo "size-limit failed or not installed. Run: pnpm install in packages/web3"
  npx size-limit 2>&1 | tee "$RESULTS/size-limit.txt" || true
fi
echo ""

# ------------------------------------------
# Step 2: Packaging health (publint + attw)
# ------------------------------------------
echo "--- Step 2: Packaging health ---"
echo ">> publint"
npx publint "$WEB3_PKG" 2>&1 | tee "$RESULTS/publint.txt" || true
echo ""
echo ">> @arethetypeswrong/cli"
npx @arethetypeswrong/cli "$TARBALL_PATH" 2>&1 | tee "$RESULTS/attw.txt" || true
echo ""

# ------------------------------------------
# Step 3: Dependency analysis
# ------------------------------------------
echo "--- Step 3: Dependency analysis ---"
cd "$WEB3_ROOT"
DIRECT_DEPS=$(node -e "console.log(Object.keys(require('./packages/web3/package.json').dependencies).length)")
echo "Direct dependencies: $DIRECT_DEPS" | tee "$RESULTS/deps.txt"

UMD_RAW=$(wc -c < "$WEB3_PKG/dist/alephium-web3.min.js" | tr -d ' ')
UMD_GZ=$(gzip -c "$WEB3_PKG/dist/alephium-web3.min.js" | wc -c | tr -d ' ')
echo "UMD bundle: ${UMD_RAW} bytes ($(( UMD_RAW / 1024 )) kB) raw, ${UMD_GZ} bytes ($(( UMD_GZ / 1024 )) kB) gzip" | tee -a "$RESULTS/deps.txt"
echo "Tarball: ${TARBALL_SIZE} bytes ($(( TARBALL_SIZE / 1024 )) kB)" | tee -a "$RESULTS/deps.txt"
echo ""

# ------------------------------------------
# Helper: install app with tarball
# ------------------------------------------
install_app() {
  local app_dir=$1
  cd "$app_dir"
  rm -rf node_modules dist pnpm-lock.yaml
  pnpm add "$TARBALL_PATH" 2>&1 | tail -3
  pnpm install 2>&1 | tail -3
}

# Helper: measure JS build output
measure_js() {
  local dir=$1
  if [ -d "$dir" ]; then
    local js_files
    js_files=$(find "$dir" -name '*.js' -o -name '*.mjs' 2>/dev/null)
    if [ -n "$js_files" ]; then
      local raw_size gz_size
      raw_size=$(echo "$js_files" | xargs cat 2>/dev/null | wc -c | tr -d ' ')
      gz_size=$(echo "$js_files" | xargs cat 2>/dev/null | gzip -c | wc -c | tr -d ' ')
      echo "${raw_size} bytes ($(( raw_size / 1024 )) kB) raw, ${gz_size} bytes ($(( gz_size / 1024 )) kB) gzip"
      return
    fi
  fi
  echo "N/A (no build output)"
}

# ------------------------------------------
# Step 4: Benchmark apps
# ------------------------------------------
echo "--- Step 4: Benchmark apps ---"

# 4a: node-cli
echo ""
echo ">> node-cli"
APP_DIR="$SCRIPT_DIR/apps/node-cli"
install_app "$APP_DIR"
NODE_MODULES_SIZE=$(du -sh "$APP_DIR/node_modules" | cut -f1)
NODE_PKG_COUNT=$(ls "$APP_DIR/node_modules" | grep -v '^\.' | wc -l | tr -d ' ')
echo "  node_modules: $NODE_MODULES_SIZE ($NODE_PKG_COUNT packages)" | tee "$RESULTS/node-cli.txt"

START_MS=$(node -e "console.log(Date.now())")
if node "$APP_DIR/index.js" 1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH > /dev/null 2>&1; then
  END_MS=$(node -e "console.log(Date.now())")
  echo "  Startup+run: $(( END_MS - START_MS ))ms" | tee -a "$RESULTS/node-cli.txt"
  echo "  Status: SUCCESS" | tee -a "$RESULTS/node-cli.txt"
else
  echo "  Status: FAILED" | tee -a "$RESULTS/node-cli.txt"
fi

# 4b: website (Vite vanilla)
echo ""
echo ">> website (Vite vanilla)"
APP_DIR="$SCRIPT_DIR/apps/website"
install_app "$APP_DIR"
if cd "$APP_DIR" && vp build 2>&1 | tail -5; then
  JS_SIZE=$(measure_js "$APP_DIR/dist/assets")
  echo "  JS bundle: $JS_SIZE" | tee "$RESULTS/website.txt"
  echo "  Status: SUCCESS" | tee -a "$RESULTS/website.txt"
  echo "  Polyfills required: vite-plugin-node-polyfills" | tee -a "$RESULTS/website.txt"
else
  echo "  Status: BUILD FAILED" | tee "$RESULTS/website.txt"
fi

# 4c: webapp (Vite + React)
echo ""
echo ">> webapp (Vite + React)"
APP_DIR="$SCRIPT_DIR/apps/webapp"
install_app "$APP_DIR"
if cd "$APP_DIR" && vp build 2>&1 | tail -5; then
  JS_SIZE=$(measure_js "$APP_DIR/dist/assets")
  echo "  JS bundle: $JS_SIZE" | tee "$RESULTS/webapp.txt"
  echo "  Status: SUCCESS" | tee -a "$RESULTS/webapp.txt"
  echo "  Polyfills required: vite-plugin-node-polyfills" | tee -a "$RESULTS/webapp.txt"
else
  echo "  Status: BUILD FAILED" | tee "$RESULTS/webapp.txt"
fi

# 4d: expo
echo ""
echo ">> expo (React Native)"
APP_DIR="$SCRIPT_DIR/apps/expo"
install_app "$APP_DIR"
rm -rf "$APP_DIR/dist"
mkdir -p "$APP_DIR/dist"
if cd "$APP_DIR" && npx expo export --platform web --output-dir dist 2>&1 | tail -10; then
  JS_SIZE=$(measure_js "$APP_DIR/dist")
  echo "  Web bundle: $JS_SIZE" | tee "$RESULTS/expo.txt"
  echo "  Status: SUCCESS (with extensive workarounds)" | tee -a "$RESULTS/expo.txt"
  echo "  Workarounds: custom entry point, Buffer/crypto polyfills, Metro resolver override," | tee -a "$RESULTS/expo.txt"
  echo "    react-native-quick-crypto, fs shim, pnpm hoisted linker, dev build required" | tee -a "$RESULTS/expo.txt"
else
  echo "  Status: BUILD FAILED (documents polyfill issues with current SDK)" | tee "$RESULTS/expo.txt"
fi

# ------------------------------------------
# Summary
# ------------------------------------------
echo ""
echo "========================================"
echo "  Summary"
echo "========================================"
echo ""
echo "=== Package metrics ==="
echo "  Direct dependencies: $DIRECT_DEPS"
echo "  UMD bundle: $(( UMD_RAW / 1024 )) kB raw, $(( UMD_GZ / 1024 )) kB gzip"
echo "  npm tarball: $(( TARBALL_SIZE / 1024 )) kB"
echo ""
echo "=== App results ==="
for f in "$RESULTS"/node-cli.txt "$RESULTS"/website.txt "$RESULTS"/webapp.txt "$RESULTS"/expo.txt; do
  if [ -f "$f" ]; then
    echo "--- $(basename "$f" .txt) ---"
    cat "$f"
    echo ""
  fi
done
echo "Full results saved to: $RESULTS/"
