# Alephium Web3 Benchmarks

Benchmarking infrastructure for the `@alephium/web3` monorepo modernization. These benchmarks capture bundle size, tree-shaking effectiveness, packaging health, and cross-environment compatibility.

## What's measured

### size-limit (in @alephium/web3 package)
Measures the real cost of importing from `@alephium/web3` through a bundler — full import, single function, and namespace imports.

### Packaging health
- **publint** — validates `package.json` configuration
- **@arethetypeswrong/cli** — validates TypeScript types resolve correctly in all environments

### Dependency analysis
- Direct and transitive dependency counts
- UMD bundle size (raw + gzip)

### Benchmark apps
Four minimal apps that each import `isValidAddress` from `@alephium/web3` and validate a hardcoded address. They measure the SDK's real-world footprint across environments:

| App | Environment | What's measured |
|---|---|---|
| `node-cli` | Node.js (CJS) | node_modules size, startup time |
| `website` | Vite (vanilla JS) | Production bundle size |
| `webapp` | Vite + React | Production bundle size |
| `expo` | Expo (React Native) | Bundle size, build success, workarounds required |

### Expo app complexity

The expo benchmark app deserves special attention. Getting `@alephium/web3` to work in React Native required **12 workarounds** including:
- Custom entry point and polyfills (`index.js`, `polyfills.js`)
- Native crypto module (`react-native-quick-crypto`) because `crypto-browserify` fails at module evaluation time
- Custom Metro resolver to bypass the UMD browser bundle (which references `self`, undefined in RN)
- Empty `fs` shim, `Buffer` global polyfill, `events`/`stream`/`path` polyfills
- pnpm `node-linker=hoisted` (Metro incompatible with strict symlinks)
- Dev build required (incompatible with Expo Go)

This complexity is fully documented in `results/baseline.md` and is a key motivator for the modernization work.

## Running

```bash
bash run.sh
```

The `run.sh` script handles node-cli, website, webapp, and the expo web export automatically.

For the expo iOS/Android build, run manually from `apps/expo/`:
```bash
npx expo prebuild --platform ios --clean
npx expo run:ios
```

Results are saved to `results/`.
