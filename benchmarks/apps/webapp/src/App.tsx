import { useState, useEffect, useMemo } from 'react'
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

// ── Helpers ──────────────────────────────────────────────────────

function useBalance(address: string | undefined, url: string) {
  const [balance, setBalance] = useState<string>('...')
  useEffect(() => {
    if (!address) return
    const provider = new NodeProvider(url)
    provider.addresses
      .getAddressesAddressBalance(address)
      .then((b) => setBalance(b.balanceHint))
      .catch(() => setBalance('unavailable'))
  }, [address, url])
  return balance
}

// ── Wallet Section ──────────────────────────────────────────────

function WalletSection() {
  const wallet = useMemo(
    () => PrivateKeyWallet.FromMnemonic({ mnemonic: MNEMONIC }),
    []
  )
  const grouplessWallet = useMemo(
    () => PrivateKeyWallet.FromMnemonic({ mnemonic: MNEMONIC, keyType: 'gl-secp256k1' }),
    []
  )

  const mainnetBalance = useBalance(wallet.address, NETWORKS.mainnet)
  const testnetBalance = useBalance(wallet.address, NETWORKS.testnet)
  const devnetBalance = useBalance(wallet.address, NETWORKS.devnet)

  const glMainnetBalance = useBalance(grouplessWallet.address, NETWORKS.mainnet)
  const glTestnetBalance = useBalance(grouplessWallet.address, NETWORKS.testnet)
  const glDevnetBalance = useBalance(grouplessWallet.address, NETWORKS.devnet)

  return (
    <section>
      <h2>HD Wallet from Mnemonic</h2>
      <p className="description">
        Derives an HD wallet from a BIP-39 mnemonic using <code>@scure/bip39</code> and <code>@scure/bip32</code>.
        The mnemonic is converted to a seed, then a private key is derived using the BIP-44 path <code>m/44'/1234'/0'/0/0</code>.
      </p>
      <dl>
        <dt>Mnemonic</dt>
        <dd className="mono small">{MNEMONIC}</dd>
      </dl>

      <h3>Default Address (secp256k1, group {groupOfAddress(wallet.address)})</h3>
      <p className="description">
        Standard Alephium address derived with the <code>default</code> key type. Assigned to group {groupOfAddress(wallet.address)} based on the address hash.
      </p>
      <dl>
        <dt>Address</dt>
        <dd className="mono">{wallet.address}</dd>
        <dt>Valid</dt>
        <dd>{isValidAddress(wallet.address) ? '✅ Yes' : '❌ No'}</dd>
        <dt>Public Key</dt>
        <dd className="mono small">{wallet.publicKey}</dd>
        <dt>Mainnet Balance</dt>
        <dd>{mainnetBalance}</dd>
        <dt>Testnet Balance</dt>
        <dd>{testnetBalance}</dd>
        <dt>Devnet Balance</dt>
        <dd>{devnetBalance}</dd>
      </dl>

      <h3>Groupless Address (gl-secp256k1)</h3>
      <p className="description">
        Groupless addresses are not tied to a specific group. Derived with the <code>gl-secp256k1</code> key type using BIP-44 path <code>m/44'/1234'/2'/0/0</code>.
      </p>
      <dl>
        <dt>Address</dt>
        <dd className="mono">{grouplessWallet.address}</dd>
        <dt>Valid</dt>
        <dd>{isValidAddress(grouplessWallet.address) ? '✅ Yes' : '❌ No'}</dd>
        <dt>Public Key</dt>
        <dd className="mono small">{grouplessWallet.publicKey}</dd>
        <dt>Mainnet Balance</dt>
        <dd>{glMainnetBalance}</dd>
        <dt>Testnet Balance</dt>
        <dd>{glTestnetBalance}</dd>
        <dt>Devnet Balance</dt>
        <dd>{glDevnetBalance}</dd>
      </dl>
    </section>
  )
}

// ── Crypto Section ──────────────────────────────────────────────

function CryptoSection() {
  const testPrivKey = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'

  const checks = useMemo(() => {
    const pubKeySecp = publicKeyFromPrivateKey(testPrivKey, 'default')
    return {
      secp256k1: { label: 'secp256k1 (default)', value: pubKeySecp, desc: 'Elliptic curve used by Bitcoin and Alephium. Derives a compressed public key from a private key using @noble/secp256k1.' },
      schnorr: { label: 'Schnorr (bip340)', value: publicKeyFromPrivateKey(testPrivKey, 'bip340-schnorr'), desc: 'Schnorr signature scheme (BIP-340). Uses the x-coordinate of the public key only.' },
      p256: { label: 'P-256 (NIST)', value: publicKeyFromPrivateKey(testPrivKey, 'gl-secp256r1'), desc: 'NIST P-256 curve, used in WebAuthn and TLS. Derived using @noble/curves.' },
      ed25519: { label: 'Ed25519', value: publicKeyFromPrivateKey(testPrivKey, 'gl-ed25519'), desc: 'Edwards curve used in SSH keys and modern protocols. Derived using @noble/curves.' },
      blake2b: { label: 'Blake2b hash', value: hashMessage('Hello Alephium!', 'blake2b'), desc: 'Blake2b-256 hash using @noble/hashes. Alephium\'s primary hash function for addresses and transactions.' },
      sha256: { label: 'SHA-256 hash', value: hashMessage('Hello Alephium!', 'sha256'), desc: 'SHA-256 hash using @noble/hashes. Used in Bitcoin-style message signing.' },
      address: { label: 'Address derivation', value: addressFromPublicKey(pubKeySecp), desc: 'Derives an Alephium address from a public key by hashing with Blake2b and encoding with Base58.' },
      sigEncode: {
        label: 'Signature encoding',
        value: encodeHexSignature(
          '934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
          '2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5'
        ),
        desc: 'Encodes r and s components into a normalized 64-byte signature. High-S values are normalized using the curve order.'
      },
      sigVerify: {
        label: 'Signature verification',
        value: String(transactionVerifySignature(
          '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2',
          '02625b26ae1c5f7986475009e4037b3e6fe6320fde3c3f3332bea11ecadc35dd13',
          '78471e7c97e558c98ac307ef699ed535ece319102fc69ea416dbb44fbb3cbf9c42dbfbf4ce73eb68c5e0d66122eb25d2ebe1cf9e37ef4c4f4e7a2ed35de141bc'
        )),
        desc: 'Verifies an ECDSA signature against a transaction hash and public key using @noble/secp256k1.'
      }
    }
  }, [])

  return (
    <section>
      <h2>Cryptographic Operations</h2>
      <p className="description">
        All operations use isomorphic <code>@noble</code> libraries — no Node.js polyfills, no <code>crypto-browserify</code>.
        Works natively in Node.js, browsers, and React Native.
      </p>
      {Object.entries(checks).map(([key, { label, value, desc }]) => (
        <div key={key} className="check-item">
          <h4>{label} {value === 'true' ? '✅' : value === 'false' ? '❌' : ''}</h4>
          <p className="description">{desc}</p>
          <code className="result">{value}</code>
        </div>
      ))}
    </section>
  )
}

// ── API Section ─────────────────────────────────────────────────

function ApiSection() {
  const [address, setAddress] = useState('1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH')
  const valid = isValidAddress(address)
  const mainnetBalance = useBalance(valid ? address : undefined, NETWORKS.mainnet)

  return (
    <section>
      <h2>Fetch API (native, no cross-fetch)</h2>
      <p className="description">
        Uses the browser's native <code>fetch</code> to query the Alephium node REST API via <code>NodeProvider</code>.
        No polyfills needed — <code>cross-fetch</code> has been removed.
      </p>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Enter an Alephium address"
      />
      <dl>
        <dt>Valid</dt>
        <dd>{valid ? '✅ Yes' : '❌ No'}</dd>
        {valid && (
          <>
            <dt>Mainnet Balance</dt>
            <dd>{mainnetBalance}</dd>
          </>
        )}
      </dl>
    </section>
  )
}

// ── App ─────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="app">
      <h1>Alephium Web3 SDK Benchmark</h1>
      <p className="subtitle">
        Testing <code>@alephium/web3</code> and <code>@alephium/web3-wallet</code> in a Vite + React app.
        No polyfill plugins. Tree-shaking enabled. All crypto is isomorphic via <code>@noble</code>.
      </p>
      <WalletSection />
      <CryptoSection />
      <ApiSection />
    </div>
  )
}
