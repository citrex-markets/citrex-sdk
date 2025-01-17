import type { Environment } from 'src/types'
import type { Chain } from 'viem'

import { sei, seiTestnet } from 'viem/chains'

const CHAINS: Record<Environment, Chain> = {
  mainnet: sei,
  testnet: seiTestnet,
}

export default CHAINS
