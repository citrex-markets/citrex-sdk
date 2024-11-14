import { describe, expect, it } from 'vitest'

import API_URL from '../api'

describe('The API_URL constant', () => {
  it('should stay unchanged', () => {
    expect(API_URL).toMatchInlineSnapshot(`
      {
        "mainnet": "https://api.rysk.finance/v1",
        "testnet": "https://api.staging.rysk.finance/v1",
      }
    `)
  })
})
