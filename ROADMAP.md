# Alephium Web3 Monorepo Modernization Roadmap

This document outlines the identified issues with the current `@alephium/web3` monorepo architecture and build setup, along with a phased roadmap to modernize the library, drawing inspiration from modern, heavily optimized libraries like `viem`.

> **Scope:** While the issues and roadmap use `@alephium/web3` as the primary example, the same problems and fixes apply across all packages in the monorepo that share these patterns — notably `@alephium/web3-wallet` and `@alephium/walletconnect-provider`, which have identical webpack/UMD/polyfill setups.

## Identified Issues

### 1. Lack of Native ES Modules (ESM) Support
The project is strictly CommonJS (CJS).
* **`package.json`**: Specifies `"type": "commonjs"`.
* **`tsconfig.json`**: Compiles to `"module": "commonjs"`.
* **Issue**: Modern JavaScript tooling (Vite, Rollup, Webpack 5) and native browser/Node environments rely heavily on ESM for aggressive tree-shaking (removing unused code). By only providing CJS, consumers using modern bundlers often end up including significantly more code than they actually use.

### 2. Monolithic UMD Browser Build vs Tree-Shaking
The library uses `webpack` to create a monolithic `alephium-web3.min.js` file for browser environments.
* **Issue**: In `package.json`, the `"browser"` and `"default"` export map fields point to this minified Webpack bundle. This completely defeats tree-shaking. If a developer imports a single utility function from `@alephium/web3` in a React application, the bundler is forced to pull in the entire minified library because it acts as a single opaque file. Modern libraries rely on exposing standard ESM files and letting the consumer's bundler (like Next.js or Vite) do the minification and tree-shaking.

### 3. Heavy Node.js Polyfills
The library was likely written with Node.js built-in modules in mind, requiring heavy polyfills for the browser.
* **`webpack.config.js`**: Reveals that `stream-browserify` and `crypto-browserify` are being bundled into the browser build.
* **Issue**: These polyfills are massive. `crypto-browserify` alone adds immense weight. Modern SDKs avoid Node-specific built-ins in their core logic, instead relying on standard Web APIs (like the Web Crypto API, which is now supported in modern Node, browsers, and edge runtimes) or lightweight isomorphic packages (like the `@noble` cryptography suites, which you already partially use via `@noble/secp256k1`).
* **Additional polyfills**: `@alephium/web3-wallet` also bundles the `buffer` npm package and `@alephium/walletconnect-provider` uses `path-browserify`. These should all be replaced with native alternatives (`Uint8Array` instead of `Buffer`, etc.).

### 4. Suboptimal `exports` Configuration
The `"exports"` field in `package.json` is not structured for modern module resolution.
```json
// Current
"exports": {
  "node": {
    "types": "./dist/src/index.d.ts",
    "default": "./dist/src/index.js"
  },
  "default": {
    "types": "./dist/src/index.d.ts",
    "default": "./dist/alephium-web3.min.js"
  }
}
```
* **Issue**: It lacks the `"import"` (ESM) and `"require"` (CJS) conditions. It does not clearly define where types live for different environments, which often causes TypeScript resolution issues (e.g., the infamous "Are the Types Wrong" errors).

### 5. Redundant/Heavy Math Dependencies
The package depends on both `bignumber.js` and `bn.js`.
* **Issue**: `BigInt` is now a native JavaScript standard (included in your `es2020` TS target). Relying heavily on large legacy math libraries bloats the bundle size unnecessarily.

### 6. Redundant Cryptography Libraries
The package depends on both `@noble/secp256k1` and `elliptic` (which itself pulls in `bn.js`).
* **`@alephium/web3`**: Lists both `@noble/secp256k1` and `elliptic` as dependencies.
* **`@alephium/web3-wallet`**: Also depends on both.
* **Issue**: `elliptic` is a large, legacy library. The `@noble` suite is its modern, audited, zero-dependency replacement. Keeping both means duplicate functionality and unnecessary bundle weight. `elliptic` should be fully removed in favor of `@noble/secp256k1`.

### 7. Global Side Effect: `BigInt.prototype.toJSON` Monkey-Patch
The entry point (`src/index.ts`) patches `BigInt.prototype.toJSON` on import.
* **Issue**: This is a global side effect — it modifies a built-in prototype for *all* code in the application, not just the library. It directly conflicts with declaring `"sideEffects": false` in `package.json`, which is critical for tree-shaking. A consumer who imports any single export from `@alephium/web3` silently gets this global mutation. This needs to be replaced with an explicit serialization strategy (e.g., a custom `replacer` function or a wrapper utility).

### 8. Outdated Node.js Engine Requirement
The `engines` field specifies `node >= 14.0.0`.
* **Issue**: Node 14 and 16 are end-of-life. Requiring such old versions forces the library to polyfill features that are natively available in modern Node (>= 18): native `fetch` (eliminating `cross-fetch`), `crypto.subtle` (Web Crypto API), and better ESM support. Bumping the minimum version unlocks significant simplifications.

---

## Proposed Roadmap for Modernization

To achieve a lightweight, highly tree-shakeable, and environment-agnostic developer experience, we will execute this modernization in phases. Each phase applies across all affected packages in the monorepo, not just `@alephium/web3`.

### Phase 0: Benchmarking Baseline
Before making any changes, capture concrete "before" metrics so we can measure the impact of each subsequent phase and present results to the team.

#### 0a. size-limit
Add `size-limit` to `@alephium/web3` to measure the real cost of importing from the package through a bundler. Configured scenarios:
* **Full import** (`import * from '@alephium/web3'`) — total cost of the library
* **Single function** (`import { isValidAddress }`) — shows tree-shaking effectiveness (or lack thereof)
* **Namespace imports** (`{ codec }`, `{ utils }`) — cost of individual sub-modules

Since the package is currently CJS-only, all named import scenarios will pull the full module graph. This IS the expected baseline — demonstrating zero tree-shaking.

#### 0b. Packaging Health Reports
Run `publint` and `@arethetypeswrong/cli` against the published package to produce a health report of packaging and type resolution issues. These generate clear pass/fail checklists that visually demonstrate the current state vs. a clean report after modernization.

#### 0c. Dependency Analysis
Capture direct dependency count, transitive dependency tree, UMD bundle size (raw + gzip), and npm tarball size.

#### 0d. Cross-Environment Benchmark Apps
Four minimal apps that each import `isValidAddress` from `@alephium/web3` and validate a hardcoded address. They serve as both compatibility tests and size benchmarks:

| App | Environment | What's measured |
|---|---|---|
| `node-cli` | Node.js (CJS) | `node_modules` size, startup time, runs without errors |
| `website` | Vite (vanilla JS) | Production JS bundle size (raw + gzip), polyfills required |
| `webapp` | Vite + React | Production JS bundle size (raw + gzip), polyfills required |
| `expo` | Expo (React Native) | Bundle size, whether it builds at all without polyfill hacks |

These apps live in `benchmarks/apps/` and reference the local `@alephium/web3` via a packed tarball (mirroring what consumers get from npm). A `benchmarks/run.sh` script orchestrates all measurements and saves results to `benchmarks/results/`.

The same benchmarks will be re-run after each phase to track progress.

### Phase 1: Environment-Agnostic Core (The "Diet")
Before changing how the code is built, we must change what code is built to ensure it runs natively everywhere.

#### 1a. Bump Minimum Node.js Version to >= 20
Update the `engines` field in the root `package.json` to require Node >= 20 (the oldest active LTS; Node 18 is EOL since April 2025). This unlocks native `fetch`, `globalThis.crypto.subtle`, and better ESM support, dramatically reducing the polyfill surface for subsequent steps.

#### 1b. Remove `cross-fetch`
With Node >= 18, `fetch` is globally available in Node, browsers, and edge runtimes. Remove the `cross-fetch` dependency from `@alephium/web3` and any other packages that use it (`@alephium/cli`). For consumers who need to customize the fetch implementation (e.g., for retries or proxies), consider exposing an optional fetch injection point (similar to how viem accepts a custom `transport`).

#### 1c. Consolidate Cryptography on `@noble`
Standardize on the `@noble` suite of isomorphic, audited, zero-dependency crypto libraries:
* **Remove `elliptic`** from all packages — replace with `@noble/secp256k1` (already a dependency).
* **Remove `blakejs`** — replace with `@noble/hashes/blake2b`.
* **Remove `crypto-browserify`** and `stream-browserify` — the `@noble` libraries and Web Crypto API eliminate the need for Node `crypto` polyfills entirely.

#### 1d. Migrate to Native `BigInt`
Strip out `bn.js` entirely — it was only used by `elliptic` which has been replaced by `@noble/secp256k1`. **`bignumber.js` is kept** for now: it's a small, zero-dependency library used only in `number.ts` for decimal formatting with thousand separators (`toFormat`). Replacing it would require writing and testing custom decimal rounding and formatting logic — the cost/benefit doesn't justify it at this stage. It can be revisited later.

#### 1e. Remove Remaining Node.js Polyfills
* **`@alephium/web3`: Done.** The core package has no `Buffer` usage in its source code. The `Buffer`-related React Native crashes were caused by dependencies (`crypto-browserify`, `elliptic`) which have been removed in 1c. The polyfill packages (`crypto-browserify`, `stream-browserify`, `path-browserify`) have also been removed from dependencies.
* **`@alephium/web3-wallet`** (future): Still depends on `buffer` explicitly and uses `Buffer` in its source. Replace with `Uint8Array` and `TextEncoder`/`TextDecoder`. Also depends on `bip39` which ships large wordlist JSON files for every language — consider replacing with `@scure/bip39` (lighter, from the same `@noble`/`@scure` ecosystem that viem uses) or ensuring only the English wordlist is included.
* **`@alephium/walletconnect-provider`** (future): Still uses `path-browserify`. Eliminate the path manipulation or use simple string operations.

#### 1f. Eliminate the `BigInt.prototype.toJSON` Monkey-Patch
**Deferred.** The monkey-patch in `src/index.ts` globally mutates `BigInt.prototype.toJSON` so that `JSON.stringify` can handle BigInt values. Removing it requires adding explicit `bigintReplacer` calls everywhere `JSON.stringify` might encounter a BigInt — including in third-party code like `@walletconnect/sign-client` which internally serializes request params. A `bigintReplacer` utility has been added to `utils.ts` for future use, but the monkey-patch is kept for now because the migration surface is too large to do safely at this stage. This means `"sideEffects": false` cannot be declared yet — it will be revisited when the other packages are modernized and the serialization boundaries are better defined.

### Phase 2: Modern Library Build Tooling
Move away from using Webpack as a library bundler.
1. **Adopt `tsup`:** Replace Webpack with `tsup` (uses esbuild under the hood). For `@alephium/web3` this is done — tsup emits both CJS (`.cjs`) and ESM (`.mjs`) from a single config.
2. **Dual-Publishing:** tsup emits `dist/index.cjs` and `dist/index.mjs` with proper `exports` conditions (`"import"` and `"require"`).
3. **Drop the UMD bundle:** The `"browser"` field and `alephium-web3.min.js` are removed. Consumer bundlers now get ESM and perform their own tree-shaking and minification.
4. **Type declarations:** Currently using `tsc --emitDeclarationOnly` alongside tsup because tsup's DTS bundler renames internal types, causing type mismatches with other workspace packages (`web3-wallet`, etc.) that still resolve types from `dist/`. Once those packages are also migrated to tsup, we can switch to tsup's built-in `dts: true` for cleaner output (`dist/index.d.ts` and `dist/index.d.mts` instead of `dist/types/src/index.d.ts`).

### Phase 3: Optimize Package Configuration
Inform bundlers how to efficiently consume the library.
1. **Proper `exports` field:** Rewrite the `package.json` exports to support conditional exports properly.
   ```json
   "exports": {
     ".": {
       "import": {
         "types": "./dist/index.d.mts",
         "default": "./dist/index.mjs"
       },
       "require": {
         "types": "./dist/index.d.ts",
         "default": "./dist/index.js"
       }
     }
   }
   ```
2. **Sub-path exports:** Expose logical sub-modules as separate entry points so consumers can import only what they need without relying solely on tree-shaking. For example:
   ```json
   "exports": {
     ".": { ... },
     "./codec": {
       "import": { "types": "./dist/codec.d.mts", "default": "./dist/codec.mjs" },
       "require": { "types": "./dist/codec.d.ts", "default": "./dist/codec.js" }
     },
     "./utils": {
       "import": { "types": "./dist/utils.d.mts", "default": "./dist/utils.mjs" },
       "require": { "types": "./dist/utils.d.ts", "default": "./dist/utils.js" }
     }
   }
   ```
   This pattern (used by viem, wagmi, and other modern libraries) gives bundlers explicit boundaries and enables more aggressive code splitting.
3. **Declare `"sideEffects": false`:** Add this to `package.json`. This is the most crucial step for tree-shaking. It tells bundlers like Webpack and Vite, "If a developer doesn't use an imported function, it is 100% safe to delete it because this file doesn't have hidden side-effects (like modifying the global `window` object)." This is only safe to declare after the `BigInt.prototype.toJSON` monkey-patch is removed (Phase 1f).

### Phase 4: CI Validation and Size Tracking
1. **Type checking:** Add `@arethetypeswrong/cli` and `publint` to the CI pipeline. These tools verify that the `package.json` exports and TypeScript definitions are correctly formed for all environments. Also run these during `prepublishOnly` so issues are caught locally before publishing.
2. **Bundle size limits:** Introduce a tool like `size-limit` in the CI to track the real-world bundle size impact of exports and ensure future PRs don't re-introduce bloat.
