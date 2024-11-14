import { describe, expect, it } from 'vitest'

import CIAO_ADDRESS from '../ciao'

describe('The CIAO_ADDRESS constant', () => {
  it('should stay unchanged', () => {
    expect(CIAO_ADDRESS).toMatchInlineSnapshot(`
      {
        "mainnet": "0x71728FDDF90233cc35D61bec7858d7c42A310ACe",
        "testnet": "0x71728FDDF90233cc35D61bec7858d7c42A310ACe",
      }
    `)
  })
})
