import { useState } from 'react'
import { isValidAddress } from '@alephium/web3'

export default function App() {
  const [address, setAddress] = useState('1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH')
  const valid = isValidAddress(address)

  return (
    <div>
      <h1>Alephium Address Validator</h1>
      <input value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: 400 }} />
      <p>{valid ? 'Valid address' : 'Invalid address'}</p>
    </div>
  )
}
