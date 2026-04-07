# Modernization Results

> Captured after modernizing `@alephium/web3`, `@alephium/web3-wallet`, and `@alephium/walletconnect-provider`. See [baseline.md](baseline.md) for the "before" state.

---

## Before vs After

> Bundle sizes measured with the full benchmark apps (HD wallet derivation, all crypto ops, balance fetching across 3 networks) — not just a single function import. Both versions tested with the same app code, same Vite build, published packages from npm.

| Metric | Before (v2.0.10) | After (v3.0.0-test.0) |
|---|---|---|
| `@alephium/web3` dependencies | 11 | **6** |
| `@alephium/web3-wallet` dependencies | 8 | **4** |
| Website bundle (vanilla JS) | 1,697 kB | **207 kB (-88%)** |
| Website bundle (gzip) | 517 kB | **69 kB (-87%)** |
| Webapp bundle (React) | 1,904 kB | **407 kB (-79%)** |
| Webapp bundle (gzip) | 580 kB | **131 kB (-77%)** |
| Vite dev server works | No | **Yes** |
| UMD browser bundles | 3 packages | **Removed** |
| ESM support | No | **Yes** |
| `sideEffects: false` | No | **Yes** |
| Tree-shaking works | No | **Yes** |
| `vite-plugin-node-polyfills` needed | Yes | **No** |
| Node polyfill dependencies | 3+ per package | **0** |
| `BigInt.prototype.toJSON` global mutation | Yes | **No** |
| Expo workarounds | 12 | **4** |
| Expo Go compatible | No | **Yes** |
| TypeScript version | 4.9.5 | **5.9.3** |
| Minimum Node version | 14 | **20** |

---

## What changed

### Build system (all three packages)

- Webpack → tsc dual-build (same approach as viem): CJS (`dist/_cjs/`), ESM (`dist/_esm/`)
- Nested `package.json` in each output directory disambiguates CJS vs ESM
- UMD bundles removed entirely
- `"sideEffects": false` declared on all three packages
- Proper `exports` with `"import"` and `"require"` conditions, separate type declarations per condition
- `publint` + `@arethetypeswrong/cli` added for packaging validation

### TypeScript

- 4.9.5 → 5.9.3 across all packages
- `moduleResolution: "bundler"` for proper `exports` field resolution
- `@types/node` 16 → 20

### `@alephium/web3` (deps: 11 → 6)

- Removed: `elliptic`, `bn.js`, `blakejs`, `crypto-browserify`, `stream-browserify`, `path-browserify`, `cross-fetch`
- Added: `@noble/curves`, `@noble/hashes`
- Node `crypto` → `globalThis.crypto`, `fs` → dynamic `import('fs')`
- `BigInt.prototype.toJSON` monkey-patch → `stringify` utility (viem-inspired)
- Swagger codegen template updated to use `stringify` automatically

### `@alephium/web3-wallet` (deps: 8 → 4)

- Removed: `elliptic`, `bip32`, `bip39`, `buffer`, `fs-extra`
- Added: `@scure/bip32`, `@scure/bip39` (lighter, same `@noble` ecosystem as viem)
- Deleted `noble-wrapper.ts` (no longer needed with `@scure/bip32`)
- Deleted `password-crypto.ts` (unused within SDK)

### `@alephium/walletconnect-provider`

- Removed: webpack, `crypto-browserify`, `stream-browserify`, `path-browserify` (all devDeps)
- No source changes needed — package had no direct Node builtin imports

---

## App Benchmarks

> Measured with the full benchmark apps using published packages from npm. Both `v2.0.10` and `v3.0.0-test.0` tested with identical app code — HD wallet derivation, all crypto operations, balance fetching across mainnet/testnet/devnet.

| App | Before (v2.0.10) | After (v3.0.0-test.0) | Change |
|---|---|---|---|
| website: JS bundle (raw) | **1,697 kB** | **207 kB** | **-88%** |
| website: JS bundle (gzip) | 517 kB | 69 kB | **-87%** |
| website: polyfill plugin needed | Yes | **No** | Removed |
| webapp: JS bundle (raw) | TBD | TBD | |
| webapp: JS bundle (gzip) | TBD | TBD | |
| webapp: polyfill plugin needed | Yes | **No** | Removed |
| webapp: Vite dev server works | No | **Yes** | Fixed |
| expo: workarounds needed | 12 | **4** | **-67%** |
| expo: works with Expo Go | No | **Yes** | Fixed |

---

## Expo: before vs after

**Before (12 workarounds):**
Custom entry point, Buffer polyfill, react-native-get-random-values, react-native-quick-crypto, readable-stream, path-browserify, events, process, fs shim, custom Metro resolver for UMD bundle, extraNodeModules for 6 builtins, node-linker=hoisted, expo-dev-client (dev build required)

**After (4 workarounds):**
1. `react-native-get-random-values` — provides `crypto.getRandomValues` for `@noble/secp256k1`
2. Custom `index.js` entry point — loads polyfills before app
3. `fs` empty shim in Metro config — Metro resolves dynamic `import('fs')` statically
4. `node-linker=hoisted` in `.npmrc` — Metro incompatible with pnpm strict mode

**No longer needed:** Buffer polyfill, react-native-quick-crypto, readable-stream, path-browserify, events, process, expo-dev-client, custom Metro resolver. **Expo Go works** — no dev build required.

---

## Issues Resolved

| Issue | Status |
|---|---|
| No ESM output | **Fixed** — dual CJS/ESM via tsc dual-build |
| UMD browser bundles | **Fixed** — removed from all three packages |
| No tree-shaking | **Fixed** — `sideEffects: false` + ESM. Website: 742 kB → 48 kB |
| Redundant crypto (`elliptic` + `@noble/secp256k1`) | **Fixed** — consolidated on `@noble`/`@scure` |
| Node polyfill dependencies | **Fixed** — all removed |
| `cross-fetch` polyfill | **Fixed** — using native `fetch` |
| Node `crypto` import | **Fixed** — using `globalThis.crypto` |
| `fs` top-level import breaking browsers | **Fixed** — dynamic import |
| `BigInt.prototype.toJSON` monkey-patch | **Fixed** — `stringify` utility |
| `sideEffects: false` | **Fixed** — declared on all three packages |
| Polyfill plugin needed for Vite | **Fixed** — `vite-plugin-node-polyfills` no longer required |
| Vite dev server broken | **Fixed** — tsc output resolves correctly |
| Expo needs dev build | **Fixed** — works with Expo Go |
| Expo needs 12 workarounds | **Fixed** — reduced to 4 |
| `bignumber.js` | **Kept** — small, zero-dep, used only for number formatting |
