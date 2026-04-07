import {
  isValidAddress,
  NodeProvider,
  publicKeyFromPrivateKey,
  addressFromPublicKey,
  groupOfAddress,
  transactionVerifySignature,
  hashMessage,
  encodeHexSignature
} from '@alephium/web3'
import { PrivateKeyWallet } from '@alephium/web3-wallet'

const MNEMONIC =
  'vault alarm sad mass witness property virus style good flower rice alpha viable evidence run glare pretty scout evil judge enroll refuse another lava'

const NETWORKS = {
  mainnet: 'https://node.mainnet.alephium.org',
  testnet: 'https://node.testnet.alephium.org',
  devnet: 'http://127.0.0.1:22973'
}

const $ = (id) => document.getElementById(id)

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
  // ── Wallet ──
  const wallet = PrivateKeyWallet.FromMnemonic({ mnemonic: MNEMONIC })
  const grouplessWallet = PrivateKeyWallet.FromMnemonic({ mnemonic: MNEMONIC, keyType: 'gl-secp256k1' })

  $('mnemonic').textContent = MNEMONIC
  $('default-address').textContent = wallet.address
  $('default-valid').textContent = isValidAddress(wallet.address) ? '✅ Yes' : '❌ No'
  $('default-pubkey').textContent = wallet.publicKey
  $('default-group').textContent = groupOfAddress(wallet.address)

  $('gl-address').textContent = grouplessWallet.address
  $('gl-valid').textContent = isValidAddress(grouplessWallet.address) ? '✅ Yes' : '❌ No'
  $('gl-pubkey').textContent = grouplessWallet.publicKey

  // Fetch balances
  for (const [net, url] of Object.entries(NETWORKS)) {
    fetchBalance(wallet.address, url).then((b) => ($(`default-${net}`).textContent = b))
    fetchBalance(grouplessWallet.address, url).then((b) => ($(`gl-${net}`).textContent = b))
  }

  // ── Crypto ──
  const testPrivKey = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'
  const pubKeySecp = publicKeyFromPrivateKey(testPrivKey, 'default')

  const checks = [
    { id: 'secp256k1', value: pubKeySecp },
    { id: 'schnorr', value: publicKeyFromPrivateKey(testPrivKey, 'bip340-schnorr') },
    { id: 'p256', value: publicKeyFromPrivateKey(testPrivKey, 'gl-secp256r1') },
    { id: 'ed25519', value: publicKeyFromPrivateKey(testPrivKey, 'gl-ed25519') },
    { id: 'blake2b', value: hashMessage('Hello Alephium!', 'blake2b') },
    { id: 'sha256', value: hashMessage('Hello Alephium!', 'sha256') },
    { id: 'addr-derive', value: addressFromPublicKey(pubKeySecp) },
    { id: 'sig-encode', value: encodeHexSignature(
      '934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
      '2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5'
    )},
    { id: 'sig-verify', value: String(transactionVerifySignature(
      '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2',
      '02625b26ae1c5f7986475009e4037b3e6fe6320fde3c3f3332bea11ecadc35dd13',
      '78471e7c97e558c98ac307ef699ed535ece319102fc69ea416dbb44fbb3cbf9c42dbfbf4ce73eb68c5e0d66122eb25d2ebe1cf9e37ef4c4f4e7a2ed35de141bc'
    ))}
  ]

  for (const { id, value } of checks) {
    $(id).textContent = value
  }

  // ── Address lookup ──
  const input = $('lookup-input')
  const validate = async () => {
    const address = input.value
    const valid = isValidAddress(address)
    $('lookup-valid').textContent = valid ? '✅ Yes' : '❌ No'
    $('lookup-balance').textContent = valid ? '...' : ''
    if (valid) {
      $('lookup-balance').textContent = await fetchBalance(address, NETWORKS.mainnet)
    }
  }
  input.addEventListener('input', validate)
  validate()
}

main()
