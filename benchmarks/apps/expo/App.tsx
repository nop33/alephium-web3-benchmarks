import { useState } from 'react'
import { View, TextInput, Text, StyleSheet } from 'react-native'
import { isValidAddress } from '@alephium/web3'

export default function App() {
  const [address, setAddress] = useState('1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH')
  const valid = isValidAddress(address)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alephium Address Validator</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} />
      <Text>{valid ? 'Valid address' : 'Invalid address'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 }
})
