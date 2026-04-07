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
| `node_modules` size | **11 MB** |
| Polyfills required | None (Node) |

### website (Vite, vanilla JS, no framework)

| Metric | Value |
|---|---|
| JS bundle (raw) | **742 kB** |
| JS bundle (gzip) | **204 kB** |
| Polyfills required | `vite-plugin-node-polyfills` |

> A plain website with one text input and one SDK function call produces a **742 kB** JavaScript bundle.

### webapp (Vite + React)

| Metric | Value |
|---|---|
| JS bundle (raw) | **928 kB** |
| JS bundle (gzip) | **261 kB** |
| Polyfills required | `vite-plugin-node-polyfills` |

> A React app with one component and one SDK function call is nearly **1 MB** of JavaScript.

### expo (React Native)

| Metric | Value |
|---|---|
| Web bundle (raw) | **1.1 MB** |
| Expo Go compatible | **No** — requires a dev build |
| Workarounds required | **12** |

> Getting `@alephium/web3` to work in React Native required 12 workarounds including Buffer polyfill, `react-native-quick-crypto`, custom Metro resolver, `fs`/`stream`/`path`/`events` polyfills, and a native dev build (incompatible with Expo Go).

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

Types resolve correctly, but **only CJS is available** — there is no ESM entry point.

---

## 5. Summary of Issues

| Issue | Impact |
|---|---|
| No tree-shaking | One function = entire library (99.2 kB vs 99.3 kB) |
| No ESM output | Bundlers cannot perform static analysis |
| Node polyfills required | Browser/RN builds need `crypto-browserify`, `stream-browserify` |
| Polyfill plugin needed for Vite | Consumers must add `vite-plugin-node-polyfills` |
| Expo needs 12 workarounds | Custom entry point, 9 polyfill/shim packages, custom Metro resolver, dev build required |
| Incompatible with Expo Go | Native crypto module required |
| UMD bundle breaks React Native | `browser` field points to UMD bundle that references `self` (undefined in RN) |
| Redundant crypto libraries | Both `elliptic` and `@noble/secp256k1` shipped |
| Redundant math libraries | Both `bn.js` and `bignumber.js` shipped |
| UMD bundle is 724 kB | 3x over webpack's own recommended limit (244 kB) |
| Global side effect | `BigInt.prototype.toJSON` monkey-patched on import |
