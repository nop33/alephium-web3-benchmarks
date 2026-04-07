# Expo Benchmark (React Native)

Tests `@alephium/web3` and `@alephium/web3-wallet` in an Expo (React Native) app — **works with Expo Go**, no dev build required.

## What it tests

- HD wallet derivation from mnemonic (default + groupless addresses)
- All key types: secp256k1, Schnorr, P-256, Ed25519
- Blake2b and SHA-256 hashing
- Signature encoding and verification
- Address validation, derivation, and interactive lookup
- Balance fetching from mainnet, testnet, and devnet

## Remaining workarounds (4)

1. **`react-native-get-random-values`** — provides `crypto.getRandomValues` for `@noble/secp256k1` in React Native
2. **Custom `index.js` entry point** — loads the polyfill before `expo/AppEntry` so it's available when `@noble` initializes
3. **`fs` empty shim** in `metro.config.js` — Metro resolves dynamic `import('fs')` statically; the shim prevents a build error (the code path is never called in RN)
4. **`node-linker=hoisted`** in `.npmrc` — Metro is incompatible with pnpm's strict symlink layout

## Run on iOS Simulator

```bash
pnpm install
pnpm start
```

Press `i` to open in the iOS Simulator (requires Xcode + Simulator installed). This uses **Expo Go** — no native build needed.

## Run on Android Emulator

```bash
pnpm install
pnpm start
```

Press `a` to open in the Android Emulator.

## Run as web export

```bash
pnpm run build:web
```

Check the output in `dist/` for the web bundle size.

## What to look for

- The app loads in Expo Go without errors
- Wallet section shows both default and groupless addresses with balances
- All crypto checks display values
- Address lookup fetches mainnet balance
- No "slice of undefined", "fs not found", or module resolution errors
