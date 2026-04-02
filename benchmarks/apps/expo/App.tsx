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

const NODE_URL = 'https://node.mainnet.alephium.org'
const nodeProvider = new NodeProvider(NODE_URL)

function useCryptoChecks() {
  return useMemo(() => {
    const testPrivKey = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'
    const checks: string[] = []

    const pubKey = publicKeyFromPrivateKey(testPrivKey, 'default')
    checks.push(`secp256k1: ${pubKey.slice(0, 16)}...`)

    const pubKeyP256 = publicKeyFromPrivateKey(testPrivKey, 'gl-secp256r1')
    checks.push(`p256: ${pubKeyP256.slice(0, 16)}...`)

    const pubKeyEd = publicKeyFromPrivateKey(testPrivKey, 'gl-ed25519')
    checks.push(`ed25519: ${pubKeyEd.slice(0, 16)}...`)

    const hashB = hashMessage('test', 'blake2b')
    checks.push(`blake2b: ${hashB.slice(0, 16)}...`)

    const hashS = hashMessage('test', 'sha256')
    checks.push(`sha256: ${hashS.slice(0, 16)}...`)

    const txHash = '8fc5f0d120b730f97f6cea5f02ae4a6ee7bf451d9261c623ea69d85e870201d2'
    const pk = '02625b26ae1c5f7986475009e4037b3e6fe6320fde3c3f3332bea11ecadc35dd13'
    const sig =
      '78471e7c97e558c98ac307ef699ed535ece319102fc69ea416dbb44fbb3cbf9c42dbfbf4ce73eb68c5e0d66122eb25d2ebe1cf9e37ef4c4f4e7a2ed35de141bc'
    checks.push(`sig verify: ${transactionVerifySignature(txHash, pk, sig)}`)

    const addr = addressFromPublicKey(pubKey)
    checks.push(`address: ${addr.slice(0, 16)}...`)

    const encoded = encodeHexSignature(
      '934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
      '2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5'
    )
    checks.push(`sig encode: ${encoded.slice(0, 16)}...`)

    return checks
  }, [])
}

export default function App() {
  const [address, setAddress] = useState('1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH')
  const [balance, setBalance] = useState<string>('')
  const valid = isValidAddress(address)
  const cryptoChecks = useCryptoChecks()

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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 },
  checks: { fontSize: 11, color: '#666', marginTop: 10, lineHeight: 18 }
})
