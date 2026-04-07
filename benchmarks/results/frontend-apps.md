# Production App Results

> Bundle size impact of upgrading `@alephium/web3` from v2.0.10 to v3.0.0-test.0 in the [alephium-frontend](https://github.com/alephium/alephium-frontend) monorepo.

These are real production apps, not synthetic benchmarks. The numbers reflect actual bundle sizes with all application code, dependencies, and assets.

---

## Explorer

Full-featured blockchain explorer ([explorer.alephium.org](https://explorer.alephium.org)).

### JS bundles

| File | Before (v2.0.10) | After (v3.0.0-test.0) | Change |
|---|---|---|---|
| `index.js` | 2,480 kB (774 kB gzip) | **730 kB (242 kB gzip)** | **-71% raw, -69% gzip** |
| `App.js` | 1,165 kB (349 kB gzip) | 1,165 kB (349 kB gzip) | No change |
| **Total JS** | **3,646 kB (1,123 kB gzip)** | **1,895 kB (591 kB gzip)** | **-48% raw, -47% gzip** |

> The `index.js` chunk contains the SDK and its dependencies — this is where the modernization has impact. The `App.js` chunk contains the explorer's own application code and other dependencies, which are unchanged.

### Other changes

- `rollup-plugin-node-polyfills` removed — no longer needed, build passes without it
- Deep imports like `@alephium/web3/dist/src/api/api-explorer` replaced with `@alephium/web3/api/explorer`

---

## Desktop Wallet

Electron-based desktop wallet with WalletConnect, Ledger support, and full transaction management.

### JS bundles

| File | Before (v2.0.10) | After (v3.0.0-test.0) | Change |
|---|---|---|---|
| `index.js` | 7,740 kB (2,580 kB gzip) | **4,944 kB (1,728 kB gzip)** | **-36% raw, -33% gzip** |

> Single JS bundle containing all application code and dependencies. The ~2,800 kB reduction comes from removing the old polyfill-heavy SDK dependencies (`elliptic`, `crypto-browserify`, `stream-browserify`, `buffer`, etc.) and enabling tree-shaking via `sideEffects: false`.

## Mobile Wallet

React Native (Expo 54) wallet with WalletConnect, biometric auth, QR scanning, and full transaction management.

### iOS bundle (Hermes bytecode)

| Metric | Before (v2.0.10) | After (v3.0.0-test.0) | Change |
|---|---|---|---|
| Bundle size | 22.5 MB | **21.3 MB** | **-5.3%** |
| Modules | 5,204 | 5,426 | +222 |

> The reduction is more modest than web apps because the React Native bundle includes the entire framework, all app code, and many non-Alephium dependencies (WalletConnect, navigation, animations, etc.). The SDK is a smaller fraction of the total. The module count increased because the unbundled tsc output has more individual files than the old webpack UMD blob.

### Other changes

- `fs` empty shim added to `metro.config.js` (Metro resolves dynamic `import('fs')` statically)
- `readable-stream` and `events` polyfills removed from `metro.config.js` (no longer needed by SDK)
- `big-integer` BigInt polyfill can be removed from `shim.ts` (dead code on modern engines)

---

## Summary

| App | Before | After | Change |
|---|---|---|---|
| Explorer: `index.js` | 2,480 kB | **730 kB** | **-71%** |
| Explorer: total JS | 3,646 kB | **1,895 kB** | **-48%** |
| Desktop wallet | 7,740 kB | **4,944 kB** | **-36%** |
| Mobile wallet (iOS) | 22.5 MB | **21.3 MB** | **-5.3%** |
