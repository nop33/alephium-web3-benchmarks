// Empty shim for Node's fs module.
// @alephium/web3 imports fs in contract.js but only uses it for
// file-based operations that don't apply in React Native.
module.exports = {}
