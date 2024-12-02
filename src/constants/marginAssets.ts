import type { Environment, HexString, MarginAssetKey } from 'src/types'

import { MarginAssets } from 'src/enums'

const MARGIN_ASSETS: Record<Environment, Record<MarginAssetKey, HexString>> = {
  mainnet: { [MarginAssets.USDC]: '0xaf88d065e77c8cc2239327c5edb3a432268e5831' },
  testnet: { [MarginAssets.USDC]: '0xb8be1401e65dc08bfb8f832fc1a27a16ca821b05' },
}

export default MARGIN_ASSETS
