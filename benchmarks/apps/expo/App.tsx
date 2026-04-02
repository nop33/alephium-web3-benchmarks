import { useState, useEffect } from 'react'
import { View, TextInput, Text, StyleSheet } from 'react-native'
import { isValidAddress, NodeProvider } from '@alephium/web3'

const NODE_URL = 'https://node.mainnet.alephium.org'
const nodeProvider = new NodeProvider(NODE_URL)

export default function App() {
  const [address, setAddress] = useState('1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH')
  const [balance, setBalance] = useState<string>('')
  const valid = isValidAddress(address)

  useEffect(() => {
    setBalance('')
    if (!valid) return

    nodeProvider.addresses
      .getAddressesAddressBalance(address)
      .then((b) => setBalance(b.balanceHint))
      .catch((err) => setBalance(`Error: ${err.message}`))
  }, [address, valid])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alephium Address Validator</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} />
      <Text>{valid ? 'Valid address' : 'Invalid address'}</Text>
      {balance ? <Text>Balance: {balance}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 }
})
