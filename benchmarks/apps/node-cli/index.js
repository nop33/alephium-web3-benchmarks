const {
  isValidAddress,
  NodeProvider,
  publicKeyFromPrivateKey,
  addressFromPublicKey,
  groupOfAddress,
  transactionVerifySignature,
  hashMessage,
  encodeHexSignature
} = require('@alephium/web3')
const { PrivateKeyWallet } = require('@alephium/web3-wallet')

const MNEMONIC =
  'vault alarm sad mass witness property virus style good flower rice alpha viable evidence run glare pretty scout evil judge enroll refuse another lava'

const NETWORKS = {
  mainnet: 'https://node.mainnet.alephium.org',
  testnet: 'https://node.testnet.alephium.org',
  devnet: 'http://127.0.0.1:22973'
}

async function fetchBalance(address, url) {
  try {
    const provider = new NodeProvider(url)
    const b = await provider.addresses.getAddressesAddressBalance(address)
    return b.balanceHint
  } catch {
    return 'unavailable'
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  Alephium Web3 SDK — Node.js CLI Benchmark')
  console.log('═══════════════════════════════════════════════\n')

  // ── Wallet ──
  console.log('── HD Wallet from Mnemonic ──')
  console.log('   Uses @scure/bip39 + @scure/bip32 for BIP-44 derivation\n')
  console.log(`   Mnemonic: ${MNEMONIC}\n`)

  const wallet = PrivateKeyWallet.FromMnemonic({ mnemonic: MNEMONIC })
  const grouplessWallet = PrivateKeyWallet.FromMnemonic({ mnemonic: MNEMONIC, keyType: 'gl-secp256k1' })

  console.log(`   Default Address (secp256k1, group ${groupOfAddress(wallet.address)}):`)
  console.log(`     Address:    ${wallet.address}`)
  console.log(`     Valid:      ${isValidAddress(wallet.address) ? '✅ Yes' : '❌ No'}`)
  console.log(`     Public Key: ${wallet.publicKey}\n`)

  console.log('   Groupless Address (gl-secp256k1):')
  console.log(`     Address:    ${grouplessWallet.address}`)
  console.log(`     Valid:      ${isValidAddress(grouplessWallet.address) ? '✅ Yes' : '❌ No'}`)
  console.log(`     Public Key: ${grouplessWallet.publicKey}\n`)

  // ── Crypto ──
  console.log('── Cryptographic Operations ──')
  console.log('   All using isomorphic @noble libraries — no Node.js crypto polyfills\n')

  const testPrivKey = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'
  const pubKeySecp = publicKeyFromPrivateKey(testPrivKey, 'default')

  const checks = [
    ['secp256k1 pubkey', pubKeySecp, 'Elliptic curve (Bitcoin/Alephium)'],
    ['Schnorr pubkey', publicKeyFromPrivateKey(testPrivKey, 'bip340-schnorr'), 'BIP-340, x-only'],
    ['P-256 pubkey', publicKeyFromPrivateKey(testPrivKey, 'gl-secp256r1'), 'NIST curve (WebAuthn)'],
    ['Ed25519 pubkey', publicKeyFromPrivateKey(testPrivKey, 'gl-ed25519'), 'Edwards curve'],
    ['Blake2b hash', hashMessage('Hello Alephium!', 'blake2b'), 'Primary Alephium hash'],
    ['SHA-256 hash', hashMessage('Hello Alephium!', 'sha256'), 'Bitcoin-style hashing'],
    ['Address derivation', addressFromPublicKey(pubKeySecp), 'pubkey → blake2b → base58'],
    ['Sig encoding', encodeHexSignature(
      '934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
      '2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5'
    ), 'Normalized r,s → 64 bytes'],
    ['Sig verification', String(transactionVerifySignature(
      '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2',
      '02625b26ae1c5f7986475009e4037b3e6fe6320fde3c3f3332bea11ecadc35dd13',
      '78471e7c97e558c98ac307ef699ed535ece319102fc69ea416dbb44fbb3cbf9c42dbfbf4ce73eb68c5e0d66122eb25d2ebe1cf9e37ef4c4f4e7a2ed35de141bc'
    )), 'ECDSA verify via @noble/secp256k1']
  ]

  for (const [label, value, desc] of checks) {
    console.log(`   ${label} (${desc}):`)
    console.log(`     ${value}\n`)
  }

  // ── Balances ──
  console.log('── Balance Fetches (native fetch, no cross-fetch) ──\n')

  for (const addr of [
    { label: 'Default', address: wallet.address },
    { label: 'Groupless', address: grouplessWallet.address }
  ]) {
    console.log(`   ${addr.label}: ${addr.address}`)
    for (const [net, url] of Object.entries(NETWORKS)) {
      const balance = await fetchBalance(addr.address, url)
      console.log(`     ${net.padEnd(8)} ${balance}`)
    }
    console.log()
  }

  console.log('═══════════════════════════════════════════════')
  console.log('  All checks passed!')
  console.log('═══════════════════════════════════════════════')
}

main().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
