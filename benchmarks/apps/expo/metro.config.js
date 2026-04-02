const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Minimal polyfills for @alephium/web3 after modernization.
// Only fs needs a shim (dynamic import, but Metro still resolves it statically).
config.resolver.extraNodeModules = {
  fs: path.resolve(__dirname, 'shims/fs.js')
}

module.exports = config
