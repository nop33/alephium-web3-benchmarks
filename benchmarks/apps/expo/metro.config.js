const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// @alephium/web3's contract.ts has a dynamic import('fs') for file-based
// contract loading. Metro resolves all imports statically, so we need an
// empty shim. This code path is never actually called in React Native.
config.resolver.extraNodeModules = {
  fs: path.resolve(__dirname, 'shims/fs.js')
}

module.exports = config
