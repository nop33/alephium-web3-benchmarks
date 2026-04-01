import { isValidAddress } from '@alephium/web3'

const input = document.getElementById('address')
const result = document.getElementById('result')

function validate() {
  const valid = isValidAddress(input.value)
  result.textContent = valid ? 'Valid address' : 'Invalid address'
}

input.addEventListener('input', validate)
validate()
