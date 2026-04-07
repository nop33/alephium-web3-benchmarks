import { useState, useEffect, useMemo } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native'
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

function useBalance(address: string | undefined, url: string) {
  const [balance, setBalance] = useState('...')
  useEffect(() => {
    if (!address) return
    new NodeProvider(url).addresses
      .getAddressesAddressBalance(address)
      .then((b) => setBalance(b.balanceHint))
      .catch(() => setBalance('unavailable'))
  }, [address, url])
  return balance
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.h2}>{title}</Text>
      {desc && <Text style={s.desc}>{desc}</Text>}
      {children}
    </View>
  )
}

function Field({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.value, mono && s.mono, small && s.small]}>{value}</Text>
    </View>
  )
}

function Check({ title, desc, value }: { title: string; desc: string; value: string }) {
  return (
    <View style={s.check}>
      <Text style={s.checkTitle}>{title}</Text>
      <Text style={s.desc}>{desc}</Text>
      <Text style={s.result}>{value}</Text>
    </View>
  )
}

function WalletSection() {
  const wallet = useMemo(() => PrivateKeyWallet.FromMnemonic({ mnemonic: MNEMONIC }), [])
  const glWallet = useMemo(() => PrivateKeyWallet.FromMnemonic({ mnemonic: MNEMONIC, keyType: 'gl-secp256k1' }), [])

  const dMainnet = useBalance(wallet.address, NETWORKS.mainnet)
  const dTestnet = useBalance(wallet.address, NETWORKS.testnet)
  const dDevnet = useBalance(wallet.address, NETWORKS.devnet)
  const gMainnet = useBalance(glWallet.address, NETWORKS.mainnet)
  const gTestnet = useBalance(glWallet.address, NETWORKS.testnet)
  const gDevnet = useBalance(glWallet.address, NETWORKS.devnet)

  return (
    <Section title="HD Wallet from Mnemonic" desc="BIP-39 mnemonic → BIP-44 derivation via @scure/bip39 + @scure/bip32">
      <Field label="Mnemonic" value={MNEMONIC} mono small />

      <Text style={s.h3}>Default Address (secp256k1, group {groupOfAddress(wallet.address)})</Text>
      <Text style={s.desc}>BIP-44 path: m/44'/1234'/0'/0/0</Text>
      <Field label="Address" value={wallet.address} mono />
      <Field label="Valid" value={isValidAddress(wallet.address) ? '✅ Yes' : '❌ No'} />
      <Field label="Public Key" value={wallet.publicKey} mono small />
      <Field label="Mainnet" value={dMainnet} />
      <Field label="Testnet" value={dTestnet} />
      <Field label="Devnet" value={dDevnet} />

      <Text style={s.h3}>Groupless Address (gl-secp256k1)</Text>
      <Text style={s.desc}>BIP-44 path: m/44'/1234'/2'/0/0</Text>
      <Field label="Address" value={glWallet.address} mono />
      <Field label="Valid" value={isValidAddress(glWallet.address) ? '✅ Yes' : '❌ No'} />
      <Field label="Public Key" value={glWallet.publicKey} mono small />
      <Field label="Mainnet" value={gMainnet} />
      <Field label="Testnet" value={gTestnet} />
      <Field label="Devnet" value={gDevnet} />
    </Section>
  )
}

function CryptoSection() {
  const testPrivKey = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'
  const pubKeySecp = publicKeyFromPrivateKey(testPrivKey, 'default')

  return (
    <Section title="Cryptographic Operations" desc="All using isomorphic @noble libraries — no Node.js polyfills">
      <Check title="secp256k1 Public Key" desc="Elliptic curve (Bitcoin/Alephium) via @noble/secp256k1" value={pubKeySecp} />
      <Check title="Schnorr Public Key (BIP-340)" desc="x-coordinate only, via @noble/secp256k1" value={publicKeyFromPrivateKey(testPrivKey, 'bip340-schnorr')} />
      <Check title="P-256 (NIST) Public Key" desc="WebAuthn curve via @noble/curves" value={publicKeyFromPrivateKey(testPrivKey, 'gl-secp256r1')} />
      <Check title="Ed25519 Public Key" desc="Edwards curve via @noble/curves" value={publicKeyFromPrivateKey(testPrivKey, 'gl-ed25519')} />
      <Check title="Blake2b Hash" desc="Alephium's primary hash via @noble/hashes" value={hashMessage('Hello Alephium!', 'blake2b')} />
      <Check title="SHA-256 Hash" desc="Bitcoin-style hashing via @noble/hashes" value={hashMessage('Hello Alephium!', 'sha256')} />
      <Check title="Address Derivation" desc="pubkey → blake2b → base58" value={addressFromPublicKey(pubKeySecp)} />
      <Check title="Signature Encoding" desc="Normalized r,s → 64 bytes" value={encodeHexSignature(
        '934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
        '2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5'
      )} />
      <Check title="Signature Verification" desc="ECDSA verify via @noble/secp256k1" value={String(transactionVerifySignature(
        '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2',
        '02625b26ae1c5f7986475009e4037b3e6fe6320fde3c3f3332bea11ecadc35dd13',
        '78471e7c97e558c98ac307ef699ed535ece319102fc69ea416dbb44fbb3cbf9c42dbfbf4ce73eb68c5e0d66122eb25d2ebe1cf9e37ef4c4f4e7a2ed35de141bc'
      ))} />
    </Section>
  )
}

function LookupSection() {
  const [address, setAddress] = useState('1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH')
  const valid = isValidAddress(address)
  const balance = useBalance(valid ? address : undefined, NETWORKS.mainnet)

  return (
    <Section title="Address Lookup (native fetch)" desc="Uses native fetch via NodeProvider. No cross-fetch polyfill.">
      <TextInput style={s.input} value={address} onChangeText={setAddress} />
      <Field label="Valid" value={valid ? '✅ Yes' : '❌ No'} />
      {valid && <Field label="Mainnet" value={balance} />}
    </Section>
  )
}

export default function App() {
  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <Text style={s.h1}>Alephium Web3 SDK Benchmark</Text>
      <Text style={s.subtitle}>Expo (React Native) — no polyfill plugins, Expo Go compatible</Text>
      <WalletSection />
      <CryptoSection />
      <LookupSection />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { padding: 20, paddingBottom: 60 },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  h2: { fontSize: 18, fontWeight: '600', marginBottom: 4, borderBottomWidth: 2, borderBottomColor: '#e9ecef', paddingBottom: 4 },
  h3: { fontSize: 15, fontWeight: '600', color: '#495057', marginTop: 14, marginBottom: 2 },
  subtitle: { color: '#6c757d', marginBottom: 16, fontSize: 13 },
  desc: { color: '#6c757d', fontSize: 12, marginBottom: 8 },
  section: { marginTop: 20 },
  field: { flexDirection: 'row', marginBottom: 4 },
  label: { fontWeight: '600', fontSize: 13, color: '#495057', width: 90 },
  value: { flex: 1, fontSize: 13 },
  mono: { fontFamily: 'Courier', fontSize: 12 },
  small: { fontSize: 10, color: '#6c757d' },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 4, padding: 8, fontFamily: 'Courier', fontSize: 12, marginBottom: 8 },
  check: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 6, padding: 10, marginBottom: 8 },
  checkTitle: { fontWeight: '600', fontSize: 13, marginBottom: 2 },
  result: { fontFamily: 'Courier', fontSize: 11, color: '#495057', backgroundColor: '#f1f3f5', padding: 6, borderRadius: 4, marginTop: 4 }
})
