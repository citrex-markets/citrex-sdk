import { describe, expect, it } from 'vitest'

import CIAO_ADDRESS from '../ciao'

describe('The CIAO_ADDRESS constant', () => {
  it('should stay unchanged', () => {
    expect(CIAO_ADDRESS).toMatchInlineSnapshot(`
      {
        "mainnet": "0x7461cFe1A4766146cAFce60F6907Ea657550670d",
        "testnet": "0x0F571400ef7D2aEc68b29e58be3adCE1Bb27f33d",
      }
    `)
  })
})
