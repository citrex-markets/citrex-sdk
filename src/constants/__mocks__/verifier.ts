import type { Environment, HexString } from 'src/types'

const VERIFIER_ADDRESS = {
  mainnet: '0x993543DC8BdFCba9fc7355d822108eF49dB6b9F9',
  testnet: '0x24f4e9Db8225e6AE220FE89782E4A010aEB7bb14',
} as Record<Environment, HexString>

export default VERIFIER_ADDRESS
