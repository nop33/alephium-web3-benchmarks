const {
  isValidAddress,
  NodeProvider,
  publicKeyFromPrivateKey,
  addressFromPublicKey,
  transactionVerifySignature,
  hashMessage,
  encodeHexSignature
} = require('@alephium/web3')

const NODE_URL = 'https://node.mainnet.alephium.org'
const address = process.argv[2] || '1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH'

console.log('--- Address Validation (blake2b, base-x) ---')
const valid = isValidAddress(address)
console.log(`Address: ${address}`)
console.log(`Valid:   ${valid}`)

console.log('\n--- Key Derivation (@noble/secp256k1, @noble/curves) ---')
const testPrivKey = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'

const pubKeyDefault = publicKeyFromPrivateKey(testPrivKey, 'default')
console.log(`secp256k1 pubkey:  ${pubKeyDefault}`)

const pubKeySchnorr = publicKeyFromPrivateKey(testPrivKey, 'bip340-schnorr')
console.log(`schnorr pubkey:    ${pubKeySchnorr}`)

const pubKeyP256 = publicKeyFromPrivateKey(testPrivKey, 'gl-secp256r1')
console.log(`p256 pubkey:       ${pubKeyP256}`)

const pubKeyEd25519 = publicKeyFromPrivateKey(testPrivKey, 'gl-ed25519')
console.log(`ed25519 pubkey:    ${pubKeyEd25519}`)

const derivedAddress = addressFromPublicKey(pubKeyDefault)
console.log(`Derived address:   ${derivedAddress}`)

console.log('\n--- Message Hashing (@noble/hashes blake2b + sha256) ---')
const hashAlph = hashMessage('Hello Alephium!', 'alephium')
console.log(`alephium hash:     ${hashAlph}`)

const hashBlake = hashMessage('Hello Alephium!', 'blake2b')
console.log(`blake2b hash:      ${hashBlake}`)

const hashSha = hashMessage('Hello Alephium!', 'sha256')
console.log(`sha256 hash:       ${hashSha}`)

console.log('\n--- Signature Verification (@noble/secp256k1) ---')
const txHash = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'
const pubKey = '02625b26ae1c5f7986475009e4037b3e6fe6320fde3c3f3332bea11ecadc35dd13'
const txSig = '78471e7c97e558c98ac307ef699ed535ece319102fc69ea416dbb44fbb3cbf9c42dbfbf4ce73eb68c5e0d66122eb25d2ebe1cf9e37ef4c4f4e7a2ed35de141bc'
const sigValid = transactionVerifySignature(txHash, pubKey, txSig)
console.log(`Signature valid:   ${sigValid}`)

console.log('\n--- Signature Encoding (@noble/secp256k1) ---')
const encoded = encodeHexSignature(
  '934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
  '2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5'
)
console.log(`Encoded signature: ${encoded}`)

console.log('\n--- Fetch API (native fetch, no cross-fetch) ---')
if (!valid) {
  console.log('Skipping balance fetch (invalid address)')
  process.exit(1)
}

const nodeProvider = new NodeProvider(NODE_URL)
nodeProvider.addresses
  .getAddressesAddressBalance(address)
  .then((balance) => {
    console.log(`Balance:           ${balance.balanceHint}`)
    console.log('\nAll checks passed!')
  })
  .catch((err) => {
    console.error(`Failed to fetch balance: ${err.message}`)
    process.exit(1)
  })
