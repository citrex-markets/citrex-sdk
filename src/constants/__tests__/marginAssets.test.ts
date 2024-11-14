import { describe, expect, it } from 'vitest'

import MARGIN_ASSETS from '../marginAssets'

describe('The MARGIN_ASSETS constant', () => {
  it('should stay unchanged', () => {
    expect(MARGIN_ASSETS).toMatchInlineSnapshot(`
      {
        "mainnet": {
          "USDC": "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
        },
        "testnet": {
          "USDC": "0xb8be1401e65dc08bfb8f832fc1a27a16ca821b05",
        },
      }
    `)
  })
})
