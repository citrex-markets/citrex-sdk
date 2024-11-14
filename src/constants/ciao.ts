import type { Environment, HexString } from 'src/types'

import 'dotenv/config'

const CIAO_ADDRESS = {
  mainnet: process.env.CIAO_MAINNET_ADDRESS,
  testnet: process.env.CIAO_TESTNET_ADDRESS,
} as Record<Environment, HexString>

export default CIAO_ADDRESS
