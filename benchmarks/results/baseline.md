# Baseline Benchmark Results — @alephium/web3 v2.0.10

> Captured: April 2026, before any modernization work.

---

## The Problem at a Glance

A developer who imports **a single function** (`isValidAddress`) from `@alephium/web3` pays nearly the **same cost** as importing the entire library. The SDK cannot be tree-shaken, requires Node.js polyfills for browser environments, and ships a 724 kB UMD bundle.

---

## 1. Tree-Shaking Effectiveness (size-limit)

How much JavaScript does a consumer's bundler pull in for each import?

| Import | Size (brotli) |
|---|---|
| Everything (`import *`) | **99.3 kB** |
| One function (`import { isValidAddress }`) | **99.2 kB** |
| Codec namespace (`import { codec }`) | **99.2 kB** |
| Utils namespace (`import { utils }`) | **99.0 kB** |

> Importing one function costs **99.9%** of importing the entire library.
> Tree-shaking is effectively non-existent.

The pre-built UMD browser bundle measures **157.5 kB** (brotli).

---

## 2. Package Metrics

| Metric | Value |
|---|---|
| Direct dependencies | **11** |
| UMD bundle (raw) | **724 kB** |
| UMD bundle (gzip) | **197 kB** |
| npm tarball (`pnpm pack`) | **1,040 kB** |

### Notable heavyweight dependencies

| Dependency | Role | Issue |
|---|---|---|
| `elliptic` | Elliptic curve crypto | Redundant — `@noble/secp256k1` already present |
| `bn.js` | Big number math | Redundant — native `BigInt` available since ES2020 |
| `bignumber.js` | Big number math | Same as above |
| `crypto-browserify` | Node `crypto` polyfill | Massive browser polyfill, replaceable with `@noble/hashes` |
| `stream-browserify` | Node `stream` polyfill | Only needed because of `crypto-browserify` |
| `cross-fetch` | `fetch` polyfill | Unnecessary with Node >= 18 |
| `blakejs` | Blake2b hashing | Replaceable with `@noble/hashes/blake2b` |

---

## 3. Real-World App Benchmarks

Four minimal apps that each do the same thing: import `isValidAddress` and check a hardcoded address. This measures the real cost a developer pays to use one SDK function.

### node-cli (Node.js CJS script)

| Metric | Value |
|---|---|
| Status | **SUCCESS** |
| `node_modules` size | **11 MB** |
| Startup + run time | **204 ms** |
| Polyfills required | None (Node) |

### website (Vite, vanilla JS, no framework)

| Metric | Value |
|---|---|
| Status | **SUCCESS** |
| JS bundle (raw) | **742 kB** |
| JS bundle (gzip) | **204 kB** |
| Polyfills required | `vite-plugin-node-polyfills` |

> A plain website with one text input and one SDK function call produces a **742 kB** JavaScript bundle.

### webapp (Vite + React)

| Metric | Value |
|---|---|
| Status | **SUCCESS** |
| JS bundle (raw) | **928 kB** |
| JS bundle (gzip) | **261 kB** |
| Polyfills required | `vite-plugin-node-polyfills` |

> A React app with one component and one SDK function call is nearly **1 MB** of JavaScript.

### expo (React Native via Expo dev build)

| Metric | Value |
|---|---|
| Status | **SUCCESS** (with extensive workarounds) |
| Web bundle (raw) | **1.1 MB** |
| Polyfills required | See full list below |
| Expo Go compatible | **No** — requires a dev build (`npx expo run:ios`) |

> Getting `@alephium/web3` to work in React Native required **11 workarounds** spanning 7 files. A developer cannot simply `npm install @alephium/web3` and import it — they must configure polyfills, shims, custom module resolution, and a native dev build.

#### Full list of workarounds required

1. **Custom entry point** (`index.js`) — must load polyfills before `expo/AppEntry` to ensure `Buffer` is globally available before any SDK code evaluates
2. **Global `Buffer` polyfill** (`polyfills.js`) — `buffer` npm package + `global.Buffer = Buffer`; the SDK uses `Buffer` throughout but React Native doesn't have it
3. **`react-native-get-random-values`** — provides `crypto.getRandomValues` which the SDK needs
4. **`react-native-quick-crypto`** — native JSI crypto implementation; `crypto-browserify` (the SDK's own dependency) fails in React Native because its modules use `Buffer` at evaluation time, before any polyfill can run
5. **`readable-stream`** — replaces `stream-browserify` (which also has `Buffer` evaluation-time issues)
6. **`path-browserify`** — polyfill for Node's `path` module
7. **`events`** — polyfill for Node's `events` module (needed by `readable-stream`)
8. **Empty `fs` shim** (`shims/fs.js`) — the SDK's `contract.js` does `require("fs")` which doesn't exist in React Native; an empty module prevents the crash
9. **Custom Metro resolver** (`metro.config.js`) — must override resolution to force `@alephium/web3` to use `dist/src/index.js` (CJS source) instead of `dist/alephium-web3.min.js` (UMD browser bundle); the UMD bundle references `self` which is undefined in React Native
10. **Metro `extraNodeModules`** — maps `crypto`, `stream`, `path`, `buffer`, `fs`, and `events` to their polyfill/shim packages
11. **pnpm `node-linker=hoisted`** (`.npmrc`) — Metro is incompatible with pnpm's default strict symlink layout; must use flat `node_modules`
12. **Dev build required** — Expo Go doesn't include the native modules needed by `react-native-quick-crypto`; must run `npx expo prebuild --platform ios && npx expo run:ios`

#### Additional dependencies added (beyond `@alephium/web3`)

| Package | Why |
|---|---|
| `buffer` | Global `Buffer` polyfill |
| `react-native-get-random-values` | `crypto.getRandomValues` for RN |
| `react-native-quick-crypto` | Native crypto (replaces `crypto-browserify`) |
| `readable-stream` | Stream polyfill (replaces `stream-browserify`) |
| `path-browserify` | Node `path` polyfill |
| `events` | Node `events` polyfill |
| `process` | Node `process` polyfill |
| `expo-dev-client` | Dev build support |
| `expo-crypto` | Expo crypto utilities |

#### Files created/modified

| File | Purpose |
|---|---|
| `index.js` | Custom entry point: loads polyfills then `expo/AppEntry` |
| `polyfills.js` | Sets `global.Buffer` and loads `react-native-get-random-values` |
| `metro.config.js` | Custom resolver + `extraNodeModules` for 6 Node builtins |
| `shims/fs.js` | Empty module to satisfy `require("fs")` |
| `.npmrc` | `node-linker=hoisted` for Metro compatibility |

---

## 4. Packaging Health

### publint

```
Suggestions:
1. pkg.browser with a string value can be refactored to use pkg.exports
   and the "browser" condition to declare browser-specific exports.
```

### @arethetypeswrong/cli

```
┌───────────────────┬──────────────────┐
│                   │ "@alephium/web3" │
├───────────────────┼──────────────────┤
│ node10            │ 🟢               │
├───────────────────┼──────────────────┤
│ node16 (from CJS) │ 🟢 (CJS)        │
├───────────────────┼──────────────────┤
│ node16 (from ESM) │ 🟢 (CJS)        │
├───────────────────┼──────────────────┤
│ bundler           │ 🟢               │
└───────────────────┴──────────────────┘
```

Types resolve correctly, but **only CJS is available** — there is no ESM entry point. The `node16 (from ESM)` row showing `(CJS)` means ESM consumers fall back to the CJS build.

---

## 5. Summary of Issues

| Issue | Impact |
|---|---|
| No tree-shaking | One function = entire library (99.2 kB vs 99.3 kB) |
| No ESM output | Bundlers cannot perform static analysis |
| Node polyfills required | Browser/RN builds need `crypto-browserify`, `stream-browserify` |
| Polyfill plugin needed for Vite | Consumers must add `vite-plugin-node-polyfills` |
| Expo needs 12 workarounds | Custom entry point, 9 polyfill/shim packages, custom Metro resolver, dev build required |
| Incompatible with Expo Go | Native crypto module required — cannot use the standard Expo Go client |
| UMD bundle breaks React Native | `browser` field points to UMD bundle that references `self` (undefined in RN) |
| Redundant crypto libraries | Both `elliptic` and `@noble/secp256k1` shipped |
| Redundant math libraries | Both `bn.js` and `bignumber.js` shipped |
| UMD bundle is 724 kB | 3x over webpack's own recommended limit (244 kB) |
| Global side effect | `BigInt.prototype.toJSON` monkey-patched on import |

---

## Modernization Results

> Captured after modernizing `@alephium/web3`, `@alephium/web3-wallet`, and `@alephium/walletconnect-provider`.

### Changes made

**Build system (all three packages):**
- Webpack → tsc triple-build (same approach as viem): CJS (`dist/_cjs/`), ESM (`dist/_esm/`), types (`dist/_types/`)
- Nested `package.json` in each output directory disambiguates CJS vs ESM (`{"type":"commonjs"}` / `{"type":"module"}`)
- UMD bundles removed entirely
- `"sideEffects": false` declared on all three packages
- Proper `exports` with `"import"` and `"require"` conditions

**TypeScript:**
- Upgraded from 4.9.5 to 5.9.3 across all packages
- `moduleResolution: "bundler"` for proper `exports` field resolution
- `@types/node` upgraded from 16 to 20

**`@alephium/web3` (deps: 11 → 6):**
- Removed: `elliptic`, `bn.js`, `blakejs`, `crypto-browserify`, `stream-browserify`, `path-browserify`, `cross-fetch`
- Added: `@noble/curves`, `@noble/hashes`
- Node `crypto` → `globalThis.crypto`, `fs` → dynamic `import('fs')`
- `BigInt.prototype.toJSON` monkey-patch → `stringify` utility (viem-inspired)
- Swagger codegen template updated to use `stringify` automatically

**`@alephium/web3-wallet` (deps: 8 → 4):**
- Removed: `elliptic`, `bip32`, `bip39`, `buffer`, `fs-extra`
- Added: `@scure/bip32`, `@scure/bip39` (lighter, same `@noble` ecosystem as viem)
- Deleted `noble-wrapper.ts` (no longer needed with `@scure/bip32`)
- Deleted `password-crypto.ts` (unused within SDK)

**`@alephium/walletconnect-provider`:**
- Removed: webpack, `crypto-browserify`, `stream-browserify`, `path-browserify` (all devDeps)
- No source changes needed — package had no direct Node builtin imports

### Real-World App Benchmarks

| App | Before | After | Change |
|---|---|---|---|
| node-cli: works | Yes | Yes | — |
| website: JS bundle (raw) | **742 kB** | **48 kB** | **-93%** |
| website: JS bundle (gzip) | 204 kB | 14 kB | **-93%** |
| website: polyfill plugin needed | Yes | **No** | Removed |
| webapp: JS bundle (raw) | **928 kB** | **238 kB** | **-74%** |
| webapp: JS bundle (gzip) | 261 kB | 74 kB | **-72%** |
| webapp: polyfill plugin needed | Yes | **No** | Removed |
| webapp: Vite dev server works | No | **Yes** | Fixed |
| expo: workarounds needed | 12 | **4** | **-67%** |
| expo: works with Expo Go | No | **Yes** | Fixed |

### Expo app workarounds: before vs after

**Before (12 workarounds):**
Custom entry point, Buffer polyfill, react-native-get-random-values, react-native-quick-crypto, readable-stream, path-browserify, events, process, fs shim, custom Metro resolver for UMD bundle, extraNodeModules for 6 builtins, node-linker=hoisted, expo-dev-client (dev build required)

**After (4 workarounds):**
1. `react-native-get-random-values` — provides `crypto.getRandomValues` for `@noble/secp256k1`
2. Custom `index.js` entry point — loads polyfills before app
3. `fs` empty shim in Metro config — Metro resolves dynamic `import('fs')` statically
4. `node-linker=hoisted` in `.npmrc` — Metro incompatible with pnpm strict mode

**No longer needed:** Buffer polyfill, react-native-quick-crypto, readable-stream, path-browserify, events, process, expo-dev-client, custom Metro resolver. **Expo Go works** — no dev build required.

### What's resolved

| Issue | Status |
|---|---|
| No ESM output | **Fixed** — dual CJS/ESM via tsc triple-build |
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

---

## Before vs After Summary

| Metric | Before | After |
|---|---|---|
| `@alephium/web3` dependencies | 11 | **6** |
| `@alephium/web3-wallet` dependencies | 8 | **4** |
| Website bundle (one function + balance fetch) | 742 kB | **48 kB (-93%)** |
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
