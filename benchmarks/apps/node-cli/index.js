const { isValidAddress } = require('@alephium/web3')

const address = process.argv[2] || '1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH'
const valid = isValidAddress(address)

console.log(`Address: ${address}`)
console.log(`Valid:   ${valid}`)

process.exit(valid ? 0 : 1)
