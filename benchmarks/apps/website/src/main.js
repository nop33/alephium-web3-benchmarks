import {
  isValidAddress,
  NodeProvider,
  publicKeyFromPrivateKey,
  addressFromPublicKey,
  transactionVerifySignature,
  hashMessage,
  encodeHexSignature
} from '@alephium/web3'

const NODE_URL = 'https://node.mainnet.alephium.org'
const nodeProvider = new NodeProvider(NODE_URL)

const input = document.getElementById('address')
const result = document.getElementById('result')
const balanceEl = document.getElementById('balance')
const cryptoEl = document.getElementById('crypto')

// Test crypto functions on load to verify @noble dependencies work in browser
function testCrypto() {
  const checks = []
  const testPrivKey = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'

  // @noble/secp256k1
  const pubKey = publicKeyFromPrivateKey(testPrivKey, 'default')
  checks.push(`secp256k1: ${pubKey.slice(0, 20)}...`)

  // @noble/curves/p256
  const pubKeyP256 = publicKeyFromPrivateKey(testPrivKey, 'gl-secp256r1')
  checks.push(`p256: ${pubKeyP256.slice(0, 20)}...`)

  // @noble/curves/ed25519
  const pubKeyEd = publicKeyFromPrivateKey(testPrivKey, 'gl-ed25519')
  checks.push(`ed25519: ${pubKeyEd.slice(0, 20)}...`)

  // @noble/hashes/blake2b
  const hashB = hashMessage('test', 'blake2b')
  checks.push(`blake2b: ${hashB.slice(0, 20)}...`)

  // @noble/hashes/sha256
  const hashS = hashMessage('test', 'sha256')
  checks.push(`sha256: ${hashS.slice(0, 20)}...`)

  // Signature verification
  const txHash = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'
  const pk = '02625b26ae1c5f7986475009e4037b3e6fe6320fde3c3f3332bea11ecadc35dd13'
  const sig = '78471e7c97e558c98ac307ef699ed535ece319102fc69ea416dbb44fbb3cbf9c42dbfbf4ce73eb68c5e0d66122eb25d2ebe1cf9e37ef4c4f4e7a2ed35de141bc'
  const sigValid = transactionVerifySignature(txHash, pk, sig)
  checks.push(`sig verify: ${sigValid}`)

  // Address derivation (blake2b + base58)
  const addr = addressFromPublicKey(pubKey)
  checks.push(`address: ${addr.slice(0, 20)}...`)

  // Signature encoding
  const encoded = encodeHexSignature(
    '934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
    '2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5'
  )
  checks.push(`sig encode: ${encoded.slice(0, 20)}...`)

  cryptoEl.textContent = 'Crypto checks: ' + checks.join(' | ')
}

async function validate() {
  const address = input.value
  const valid = isValidAddress(address)
  result.textContent = valid ? 'Valid address' : 'Invalid address'
  balanceEl.textContent = ''

  if (valid) {
    try {
      const balance = await nodeProvider.addresses.getAddressesAddressBalance(address)
      balanceEl.textContent = `Balance: ${balance.balanceHint}`
    } catch (err) {
      balanceEl.textContent = `Failed to fetch balance: ${err.message}`
    }
  }
}

testCrypto()
input.addEventListener('input', validate)
validate()
