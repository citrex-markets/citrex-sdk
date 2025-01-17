import { describe, expect, it } from 'vitest'

import MARGIN_ASSETS from '../marginAssets'

describe('The MARGIN_ASSETS constant', () => {
  it('should stay unchanged', () => {
    expect(MARGIN_ASSETS).toMatchInlineSnapshot(`
      {
        "mainnet": {
          "USDC": "0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1",
        },
        "testnet": {
          "USDC": "0x79A59c326C715AC2d31C169C85d1232319E341ce",
        },
      }
    `)
  })
})
