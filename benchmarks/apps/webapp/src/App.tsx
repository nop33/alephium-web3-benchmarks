import { useState, useEffect } from 'react'
import { isValidAddress, NodeProvider } from '@alephium/web3'

const NODE_URL = 'https://node.testnet.alephium.org'
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
    <div>
      <h1>Alephium Address Validator</h1>
      <input value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: 400 }} />
      <p>{valid ? 'Valid address' : 'Invalid address'}</p>
      {balance && <p>Balance: {balance}</p>}
    </div>
  )
}
