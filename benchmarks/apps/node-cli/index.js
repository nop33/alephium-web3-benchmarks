const { isValidAddress, NodeProvider } = require('@alephium/web3')

const NODE_URL = 'https://node.mainnet.alephium.org'
const address = process.argv[2] || '1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH'
const valid = isValidAddress(address)

console.log(`Address: ${address}`)
console.log(`Valid:   ${valid}`)

if (!valid) {
  process.exit(1)
}

const nodeProvider = new NodeProvider(NODE_URL)
nodeProvider.addresses
  .getAddressesAddressBalance(address)
  .then((balance) => {
    console.log(`Balance: ${balance.balanceHint}`)
  })
  .catch((err) => {
    console.error(`Failed to fetch balance: ${err.message}`)
    process.exit(1)
  })
