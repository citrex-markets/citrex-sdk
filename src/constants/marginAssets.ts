import type { Environment, HexString, MarginAssetKey } from 'src/types'

import { MarginAssets } from 'src/enums'

const MARGIN_ASSETS: Record<Environment, Record<MarginAssetKey, HexString>> = {
  mainnet: { [MarginAssets.USDC]: '0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1' },
  testnet: { [MarginAssets.USDC]: '0x79A59c326C715AC2d31C169C85d1232319E341ce' },
}

export default MARGIN_ASSETS
