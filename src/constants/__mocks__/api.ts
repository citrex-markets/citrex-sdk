import type { Environment } from 'src/types'

const API_URL = {
  mainnet: 'https://api.rysk.finance/v1',
  testnet: 'https://api.staging.rysk.finance/v1',
} as Record<Environment, string>

export default API_URL
