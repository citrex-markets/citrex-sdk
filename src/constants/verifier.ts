import type { Environment, HexString } from 'src/types'

import 'dotenv/config'

const VERIFIER_ADDRESS = {
  mainnet: process.env.ORDER_DISPATCH_MAINNET_ADDRESS,
  testnet: process.env.ORDER_DISPATCH_TESTNET_ADDRESS,
} as Record<Environment, HexString>

export default VERIFIER_ADDRESS
