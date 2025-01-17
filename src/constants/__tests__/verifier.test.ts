import { describe, expect, it } from 'vitest'

import VERIFIER_ADDRESS from '../verifier'

describe('The VERIFIER_ADDRESS constant', () => {
  it('should stay unchanged', () => {
    expect(VERIFIER_ADDRESS).toMatchInlineSnapshot(`
      {
        "mainnet": "0x993543DC8BdFCba9fc7355d822108eF49dB6b9F9",
        "testnet": "0x24f4e9Db8225e6AE220FE89782E4A010aEB7bb14",
      }
    `)
  })
})
