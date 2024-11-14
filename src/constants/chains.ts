import type { Environment } from 'src/types'
import type { Chain } from 'viem'

import { arbitrum, arbitrumSepolia } from 'viem/chains'

const CHAINS: Record<Environment, Chain> = {
  mainnet: arbitrum,
  testnet: arbitrumSepolia,
}

export default CHAINS
