// Polyfills required by @alephium/web3 in React Native.
const { Buffer } = require('buffer')
global.Buffer = Buffer

require('react-native-get-random-values')
