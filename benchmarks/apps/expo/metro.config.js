const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Polyfill Node.js builtins required by @alephium/web3.
// Uses react-native-quick-crypto (native JSI) instead of crypto-browserify,
// and readable-stream instead of stream-browserify.
config.resolver.extraNodeModules = {
  crypto: require.resolve('react-native-quick-crypto'),
  stream: require.resolve('readable-stream'),
  path: require.resolve('path-browserify'),
  buffer: require.resolve('buffer/'),
  fs: path.resolve(__dirname, 'shims/fs.js'),
  events: require.resolve('events')
}

module.exports = config
