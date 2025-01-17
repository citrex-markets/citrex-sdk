import type { Environment } from 'src/types'

const API_URL = {
  mainnet: 'https://api.citrex.markets/v1',
  testnet: 'https://api.staging.citrex.markets/v1',
} as Record<Environment, string>

export default API_URL
