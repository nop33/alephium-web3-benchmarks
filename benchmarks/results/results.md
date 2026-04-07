# Modernization Results

> Captured after modernizing `@alephium/web3`, `@alephium/web3-wallet`, and `@alephium/walletconnect-provider`. See [baseline.md](baseline.md) for the "before" state.

---

## Before vs After

| Metric | Before | After |
|---|---|---|
| `@alephium/web3` dependencies | 11 | **6** |
| `@alephium/web3-wallet` dependencies | 8 | **4** |
| Website bundle (vanilla JS) | 742 kB | **48 kB (-93%)** |
| Website bundle (gzip) | 204 kB | **14 kB (-93%)** |
| Webapp bundle (React) | 928 kB | **238 kB (-74%)** |
| Webapp bundle (gzip) | 261 kB | **74 kB (-72%)** |
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

| App | Before | After | Change |
|---|---|---|---|
| website: JS bundle (raw) | **742 kB** | **48 kB** | **-93%** |
| website: JS bundle (gzip) | 204 kB | 14 kB | **-93%** |
| website: polyfill plugin needed | Yes | **No** | Removed |
| webapp: JS bundle (raw) | **928 kB** | **238 kB** | **-74%** |
| webapp: JS bundle (gzip) | 261 kB | 74 kB | **-72%** |
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
