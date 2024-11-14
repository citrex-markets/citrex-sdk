import type { Environment, HexString } from 'src/types'

const VERIFIER_ADDRESS = {
  mainnet: '0x27809a3Bd3cf44d855f1BE668bFD16D34bcE157C',
  testnet: '0x27809a3Bd3cf44d855f1BE668bFD16D34bcE157C',
} as Record<Environment, HexString>

export default VERIFIER_ADDRESS
