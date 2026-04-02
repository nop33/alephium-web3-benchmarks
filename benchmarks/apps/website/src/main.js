import { isValidAddress, NodeProvider } from '@alephium/web3'

const NODE_URL = 'https://node.mainnet.alephium.org'
const nodeProvider = new NodeProvider(NODE_URL)

const input = document.getElementById('address')
const result = document.getElementById('result')
const balanceEl = document.getElementById('balance')

async function validate() {
  const address = input.value
  const valid = isValidAddress(address)
  result.textContent = valid ? 'Valid address' : 'Invalid address'
  balanceEl.textContent = ''

  if (valid) {
    try {
      const balance = await nodeProvider.addresses.getAddressesAddressBalance(address)
      balanceEl.textContent = `Balance: ${balance.balanceHint}`
    } catch (err) {
      balanceEl.textContent = `Failed to fetch balance: ${err.message}`
    }
  }
}

input.addEventListener('input', validate)
validate()
