# Website Benchmark (Vite, vanilla JS)

Tests `@alephium/web3` and `@alephium/web3-wallet` in a plain Vite website — no framework, no polyfill plugins.

## What it tests

- HD wallet derivation from mnemonic (default + groupless addresses)
- All key types: secp256k1, Schnorr, P-256, Ed25519
- Blake2b and SHA-256 hashing
- Signature encoding and verification
- Address validation, derivation, and balance lookup
- Balance fetching from mainnet, testnet, and devnet
- **No `vite-plugin-node-polyfills`** — the SDK works natively in the browser

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

- All crypto checks should display values (not errors)
- Both addresses should show as valid
- Mainnet balances should load
- Testnet/devnet balances show "unavailable" if those networks aren't accessible
- The production build should produce a small JS bundle (~48 kB without React)
