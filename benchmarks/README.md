# Alephium Web3 Benchmarks

Benchmark apps and tooling for measuring the impact of the `@alephium/web3` monorepo modernization. Tests bundle size, tree-shaking, cross-environment compatibility, and SDK functionality.

## Benchmark Apps

Four apps that exercise the same SDK features across different environments:

| App | Environment | Build Tool |
|---|---|---|
| `node-cli` | Node.js (CJS) | None (direct `require`) |
| `website` | Vite (vanilla JS) | Vite |
| `webapp` | Vite + React | Vite |
| `expo` | Expo (React Native) | Metro |

### What each app tests

Every app derives an HD wallet from a mnemonic, generates both a default and groupless address, fetches balances from mainnet/testnet/devnet, and runs all cryptographic operations:

- **HD wallet derivation** — `@scure/bip39` + `@scure/bip32` via `PrivateKeyWallet.FromMnemonic`
- **Key derivation** — secp256k1, Schnorr (BIP-340), P-256 (NIST), Ed25519 via `@noble`
- **Hashing** — Blake2b and SHA-256 via `@noble/hashes`
- **Signature encoding and verification** — via `@noble/secp256k1`
- **Address derivation and validation** — Blake2b + Base58
- **Balance fetching** — native `fetch` via `NodeProvider` (mainnet, testnet, devnet)

### Expo setup

After modernization, the Expo app requires only **4 workarounds** (down from 12):

1. `react-native-get-random-values` — provides `crypto.getRandomValues` for `@noble/secp256k1`
2. Custom `index.js` entry point — loads polyfills before the app
3. `fs` empty shim in Metro config — Metro resolves dynamic `import('fs')` statically
4. `node-linker=hoisted` in `.npmrc` — Metro is incompatible with pnpm's strict symlink layout

No dev build required — **works with Expo Go**.

## Testing with Local Registry

`test-local.sh` starts a Verdaccio Docker container, builds and publishes all monorepo packages to it, so you can install them in the benchmark apps exactly as consumers would from npm:

```bash
bash test-local.sh
```

Then in any benchmark app:
```bash
echo "@alephium:registry=http://localhost:4873" > .npmrc
pnpm add @alephium/web3@<version> @alephium/web3-wallet@<version>
```

## Results

- **[results/baseline.md](results/baseline.md)** — "before" metrics captured prior to any changes
- **[results/results.md](results/results.md)** — "after" metrics with before/after comparisons

Headline numbers:

| Metric | Before | After |
|---|---|---|
| Website bundle | 742 kB | **48 kB (-93%)** |
| Webapp bundle | 928 kB | **238 kB (-74%)** |
| Polyfill plugin needed | Yes | **No** |
| Expo workarounds | 12 | **4** |
| Expo Go compatible | No | **Yes** |
| Tree-shaking works | No | **Yes** |
