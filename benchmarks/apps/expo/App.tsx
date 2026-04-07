import { useState, useEffect, useMemo } from 'react'
import { View, TextInput, Text, StyleSheet, ScrollView } from 'react-native'
import {
  isValidAddress,
  NodeProvider,
  publicKeyFromPrivateKey,
  addressFromPublicKey,
  transactionVerifySignature,
  hashMessage,
  encodeHexSignature
} from '@alephium/web3'
import { PrivateKeyWallet } from '@alephium/web3-wallet'

const NODE_URL = 'https://node.mainnet.alephium.org'
const DEVNET_URL = 'http://127.0.0.1:22973'
const MNEMONIC =
  'vault alarm sad mass witness property virus style good flower rice alpha viable evidence run glare pretty scout evil judge enroll refuse another lava'

const nodeProvider = new NodeProvider(NODE_URL)

function useCryptoChecks() {
  return useMemo(() => {
    const testPrivKey = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'
    const checks: string[] = []

    checks.push(`secp256k1: ${publicKeyFromPrivateKey(testPrivKey, 'default').slice(0, 16)}...`)
    checks.push(`p256: ${publicKeyFromPrivateKey(testPrivKey, 'gl-secp256r1').slice(0, 16)}...`)
    checks.push(`ed25519: ${publicKeyFromPrivateKey(testPrivKey, 'gl-ed25519').slice(0, 16)}...`)
    checks.push(`blake2b: ${hashMessage('test', 'blake2b').slice(0, 16)}...`)
    checks.push(`sha256: ${hashMessage('test', 'sha256').slice(0, 16)}...`)

    const txHash = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'
    const pk = '02625b26ae1c5f7986475009e4037b3e6fe6320fde3c3f3332bea11ecadc35dd13'
    const sig =
      '78471e7c97e558c98ac307ef699ed535ece319102fc69ea416dbb44fbb3cbf9c42dbfbf4ce73eb68c5e0d66122eb25d2ebe1cf9e37ef4c4f4e7a2ed35de141bc'
    checks.push(`sig verify: ${transactionVerifySignature(txHash, pk, sig)}`)
    checks.push(`address: ${addressFromPublicKey(publicKeyFromPrivateKey(testPrivKey, 'default')).slice(0, 16)}...`)

    const encoded = encodeHexSignature(
      '934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
      '2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5'
    )
    checks.push(`sig encode: ${encoded.slice(0, 16)}...`)

    return checks
  }, [])
}

function useWallet() {
  const [walletInfo, setWalletInfo] = useState<string>('Deriving wallet...')

  useEffect(() => {
    try {
      const wallet = PrivateKeyWallet.FromMnemonic({
        mnemonic: MNEMONIC,
        nodeProvider: new NodeProvider(DEVNET_URL)
      })
      let info = `Wallet: ${wallet.address.slice(0, 20)}... (group ${wallet.group})`

      wallet.nodeProvider.addresses
        .getAddressesAddressBalance(wallet.address)
        .then((b) => setWalletInfo(`${info}\nDevnet balance: ${b.balanceHint}`))
        .catch(() => setWalletInfo(`${info}\nDevnet not available`))
    } catch (err: any) {
      setWalletInfo(`Wallet error: ${err.message}`)
    }
  }, [])

  return walletInfo
}

export default function App() {
  const [address, setAddress] = useState('1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH')
  const [balance, setBalance] = useState<string>('')
  const valid = isValidAddress(address)
  const cryptoChecks = useCryptoChecks()
  const walletInfo = useWallet()

  useEffect(() => {
    setBalance('')
    if (!valid) return

    nodeProvider.addresses
      .getAddressesAddressBalance(address)
      .then((b) => setBalance(b.balanceHint))
      .catch((err) => setBalance(`Error: ${err.message}`))
  }, [address, valid])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Alephium Address Validator</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} />
      <Text>{valid ? 'Valid address' : 'Invalid address'}</Text>
      {balance ? <Text>Balance: {balance}</Text> : null}
      <Text style={styles.checks}>{cryptoChecks.join('\n')}</Text>
      <Text style={styles.checks}>{walletInfo}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 },
  checks: { fontSize: 11, color: '#666', marginTop: 10, lineHeight: 18 }
})
