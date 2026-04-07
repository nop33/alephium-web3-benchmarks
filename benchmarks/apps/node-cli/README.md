# Node.js CLI Benchmark

Tests `@alephium/web3` and `@alephium/web3-wallet` in a plain Node.js CJS environment.

## What it tests

- HD wallet derivation from mnemonic (default + groupless addresses)
- All key types: secp256k1, Schnorr, P-256, Ed25519
- Blake2b and SHA-256 hashing
- Signature encoding and verification
- Address validation and derivation
- Balance fetching from mainnet, testnet, and devnet (native `fetch`, no `cross-fetch`)

## Run

```bash
pnpm install
node index.js
```

## Prerequisites

- Node.js >= 20
- Devnet running locally for devnet balance fetch (optional — will show "unavailable" if not running)

## Expected output

All cryptographic operations print their results, followed by balance fetches from each network. The script exits with code 0 on success.
