import { describe, expect, it } from 'vitest'

import VERIFIER_ADDRESS from '../verifier'

describe('The VERIFIER_ADDRESS constant', () => {
  it('should stay unchanged', () => {
    expect(VERIFIER_ADDRESS).toMatchInlineSnapshot(`
      {
        "mainnet": "0x27809a3Bd3cf44d855f1BE668bFD16D34bcE157C",
        "testnet": "0x27809a3Bd3cf44d855f1BE668bFD16D34bcE157C",
      }
    `)
  })
})
