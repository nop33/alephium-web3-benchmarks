# Alephium Web3 Monorepo Modernization

This repo documents the modernization of the [`@alephium/web3`](https://github.com/alephium/alephium-web3) monorepo — the roadmap, decisions, benchmark results, and reference apps used to validate the changes.

## Repo Structure

```
benchmarks/
  apps/
    node-cli/           # Node.js CLI benchmark app
    website/            # Vite vanilla JS benchmark app
    webapp/             # Vite + React benchmark app
    expo/               # Expo (React Native) benchmark app
  results/
    baseline.md         # Before/after benchmark report
  test-local.sh         # Verdaccio local registry for testing published packages
  README.md             # Benchmark documentation
README.md               # This file — roadmap, decisions, and status
```

The benchmark apps test the published `@alephium/web3` and `@alephium/web3-wallet` packages across four environments (Node.js, vanilla website, React webapp, React Native/Expo), exercising HD wallet derivation, all cryptographic operations, address validation, and balance fetching on mainnet/testnet/devnet.

## Roadmap

Below is the full roadmap with identified issues, completed work, results, and next steps.

---

## Identified Issues (original state)

1. **No ESM output** — strictly CommonJS, defeating tree-shaking in modern bundlers
2. **Monolithic UMD browser bundles** — webpack-generated `alephium-web3.min.js` forced on all browser consumers
3. **Heavy Node.js polyfills** — `crypto-browserify`, `stream-browserify`, `path-browserify`, `buffer` shipped as dependencies
4. **Suboptimal `exports` configuration** — missing `"import"`/`"require"` conditions, no proper type resolution
5. **Redundant math dependencies** — both `bignumber.js` and `bn.js`
6. **Redundant cryptography libraries** — both `elliptic` and `@noble/secp256k1`
7. **Global side effect** — `BigInt.prototype.toJSON` monkey-patch on import, blocking `"sideEffects": false`
8. **Outdated Node.js requirement** — `node >= 14.0.0`

---

## Completed Work

### Phase 0: Benchmarking Baseline ✅

Captured "before" metrics with four benchmark apps (node-cli, website, webapp, expo) and tooling (size-limit, publint, attw). Results documented in `benchmarks/results/baseline.md`.

A Verdaccio-based local registry script (`benchmarks/test-local.sh`) enables testing published packages exactly as consumers would experience them from npm.

### Phase 1: Environment-Agnostic Core ✅

#### `@alephium/web3` (dependencies: 11 → 6)
- **1a.** Node.js minimum bumped to >= 20
- **1b.** `cross-fetch` removed — using native `fetch`
- **1c.** Crypto consolidated on `@noble`: `elliptic` → `@noble/secp256k1`, `blakejs` → `@noble/hashes/blake2b`, added `@noble/curves` for p256/ed25519
- **1d.** `bn.js` removed (was only used by `elliptic`). `bignumber.js` kept — small, zero-dep, used only for decimal formatting
- **1e.** All Node polyfills removed (`crypto-browserify`, `stream-browserify`, `path-browserify`). Node `crypto` import replaced with `globalThis.crypto`. `fs` import made dynamic (`await import('fs')`)
- **1f.** `BigInt.prototype.toJSON` monkey-patch removed — replaced with `stringify` utility (viem-inspired). Swagger codegen template (`configs/http-client.eta`) captures the base template output and replaces `JSON.stringify` with `stringify` automatically

#### `@alephium/web3-wallet` (dependencies: 8 → 4)
- `elliptic` → `@noble/secp256k1.utils.randomPrivateKey()`
- `bip39` → `@scure/bip39` (lighter, no wordlist bloat)
- `bip32` → `@scure/bip32` (eliminated `noble-wrapper.ts` adapter entirely)
- `password-crypto.ts` deleted (unused within SDK)
- `buffer`, `fs-extra`, `crypto-browserify`, `stream-browserify` removed

#### `@alephium/walletconnect-provider`
- No source changes needed — had no direct Node builtin imports
- Polyfill devDependencies removed (`crypto-browserify`, `stream-browserify`, `path-browserify`)

### Phase 2: Modern Build Tooling ✅

Replaced webpack with **tsc dual-build** (same approach as viem) across all three packages:

- Two `tsc` passes: CJS → `dist/_cjs/`, ESM → `dist/_esm/`
- Each output directory has a nested `package.json` (`{"type":"commonjs"}` / `{"type":"module","sideEffects":false}`)
- `--declaration` emits `.d.ts` alongside `.js` in both directories
- UMD bundles removed entirely

**Why tsc instead of tsup:** tsup was tried first but had ESM resolution issues — bare import paths like `"./api"` in `.mjs` files resolved to `.js` (CJS) instead of `.mjs`, breaking Vite's dev server. The tsc dual-build approach avoids this by using `.js` everywhere and disambiguating via the nested `package.json` `"type"` field.

### Phase 3: Package Configuration ✅

- **`exports` field** — proper `"import"`/`"require"` conditions with separate type declarations per condition, avoiding FalseCJS/FalseESM type issues
- **`"sideEffects": false`** — declared on all three packages
- **`"type": "commonjs"`** — declared on all three packages (Node.js performance hint, prevents auto-detection)
- **`main`/`module`/`types`** — fallback fields for legacy consumers

### TypeScript 5 Upgrade ✅

- TypeScript 4.9.5 → 5.9.3 across all 8 packages
- `moduleResolution: "bundler"` for proper `exports` field resolution
- `@types/node` 16 → 20
- ts-jest configured with CJS override for test compatibility

### Packaging Quality Checks ✅

- `publint` + `@arethetypeswrong/cli` added to web3, web3-wallet, and walletconnect
- `pnpm check` runs both tools; `pnpm -r run --if-present check` from root
- `internal-resolution-error` ignored in attw — tsc doesn't rewrite import paths in `.d.ts` files, so bare specifiers fail strict `node16` ESM resolution. This is a known limitation affecting most dual CJS/ESM packages including viem. `node10`, `node16 (from CJS)`, and `bundler` all resolve correctly.

### Results

| Metric | Before | After |
|---|---|---|
| Website bundle (vanilla JS) | 742 kB | **48 kB (-93%)** |
| Website bundle (gzip) | 204 kB | **14 kB (-93%)** |
| Webapp bundle (React) | 928 kB | **238 kB (-74%)** |
| Webapp bundle (gzip) | 261 kB | **74 kB (-72%)** |
| `@alephium/web3` dependencies | 11 | **6** |
| `@alephium/web3-wallet` dependencies | 8 | **4** |
| Vite dev server works | No | **Yes** |
| UMD bundles | 3 packages | **Removed** |
| ESM support | No | **Yes** |
| Tree-shaking works | No | **Yes** |
| `vite-plugin-node-polyfills` needed | Yes | **No** |
| `BigInt.prototype.toJSON` mutation | Yes | **No** |
| Expo workarounds | 12 | **4** |
| Expo Go compatible | No | **Yes** |
| TypeScript | 4.9.5 | **5.9.3** |
| Node.js minimum | 14 | **20** |

---

## Next Steps

### High Priority

#### 1. CI pipeline updates
- Add `size-limit` checks with budgets per export

#### 2. Sub-path exports for `@alephium/web3`
- Expose `@alephium/web3/codec`, `@alephium/web3/address`, `@alephium/web3/utils`, etc.
- Gives bundlers explicit module boundaries for even better tree-shaking
- Follows viem's pattern

### Medium Priority

#### 3. Migrate Jest → Vitest
- Unblocks `@noble` v2 upgrade (ESM-only packages)
- Faster test execution, native ESM support
- Affects all test files across the monorepo

#### 4. Upgrade to `@noble` v2
- Requires Vitest first
- `@noble/hashes` 1.6.1 → 2.x, `@noble/curves` 1.6.0 → 2.x
- Update import paths (`blake2b` → `blake2.js`, `sha256` → `sha2.js`, `p256` → `nist.js`)

#### 5. Replace `@noble/secp256k1` v1.7.1 with `@noble/curves/secp256k1`
- Eliminates a separate dependency
- Requires signing code refactor (different API)

### Low Priority

#### 6. Modernize `@alephium/web3-react` and `@alephium/get-extension-wallet`
- Already use Rollup (relatively modern)
- Could switch to tsc dual-build for consistency
- Not urgent — no polyfill/UMD problems

#### 7. Remove `bignumber.js`
- Small, zero-dep, used only for number formatting
- Low impact on bundle size

#### 8. Size tracking in CI
- `size-limit` checks with budgets per export
- Track bundle size over time to prevent regressions
