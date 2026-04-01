const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Force Metro to use the CJS source files (main field) instead of the
// UMD browser bundle (browser field) for @alephium/web3. The UMD bundle
// references `self` which doesn't exist in React Native.
const web3CjsEntry = path.resolve(
  __dirname,
  'node_modules/@alephium/web3/dist/src/index.js'
)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@alephium/web3') {
    return { type: 'sourceFile', filePath: web3CjsEntry }
  }
  return context.resolveRequest(context, moduleName, platform)
}

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
