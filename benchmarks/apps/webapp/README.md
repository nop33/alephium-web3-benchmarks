# Webapp Benchmark (Vite + React)

Tests `@alephium/web3` and `@alephium/web3-wallet` in a Vite + React app — no polyfill plugins.

## What it tests

- HD wallet derivation from mnemonic (default + groupless addresses)
- All key types: secp256k1, Schnorr, P-256, Ed25519
- Blake2b and SHA-256 hashing
- Signature encoding and verification
- Address validation, derivation, and interactive lookup
- Balance fetching from mainnet, testnet, and devnet
- **No `vite-plugin-node-polyfills`** — the SDK works natively in the browser
- **Vite dev server works** — no blank screen or module resolution errors

## Run (development)

```bash
pnpm install
pnpm start
```

Open http://localhost:5173

## Run (production build)

```bash
pnpm build
pnpm preview
```

Open http://localhost:4173. Check the build output for the JS bundle size.

## What to look for

- All sections render with data (no blank screen)
- Wallet section shows both default and groupless addresses
- All crypto checks display values
- Address lookup fetches mainnet balance
- Vite dev server works without errors in the browser console
- The production build should produce a JS bundle of ~238 kB (includes React)
