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

## What "After" Should Look Like

After completing the modernization roadmap, we expect:

| Metric | Before | Target |
|---|---|---|
| `isValidAddress` import size | 99.2 kB | < 10 kB |
| Full import size | 99.3 kB | < 50 kB |
| Website bundle (one function) | 742 kB | < 50 kB |
| Webapp bundle (one function) | 928 kB | < 250 kB |
| Expo bundle (one function) | 1.1 MB | < 300 kB |
| Polyfills required | Yes | **None** |
| Expo workarounds needed | 12 (polyfills, shims, custom resolver, dev build, .npmrc) | **None** |
| Works in Expo Go | No | **Yes** |
| ESM support | No | **Yes** |
| Direct dependencies | 11 | < 5 |
| `sideEffects: false` | No | **Yes** |
