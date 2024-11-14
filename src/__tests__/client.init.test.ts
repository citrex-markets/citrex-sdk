import { beforeEach, describe, expect, it, vi } from 'vitest'

import RyskSDK from 'src'
import { Environment } from 'src/enums'
import { privateKey } from 'vitest/utils'

describe('The RyskSDK', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  it('should initialise correctly with only required params', () => {
    const Client = new RyskSDK(privateKey)

    expect(Client).toMatchSnapshot()
  })

  it('should initialise correctly with all config parameters passed', () => {
    const Client = new RyskSDK(privateKey, {
      debug: true,
      environment: Environment.TESTNET,
      rpc: 'https://test-rpc.quiknode.pro',
      subAccountId: 2,
    })

    expect(Client).toMatchSnapshot()
  })

  it('should POST the referral code if running on mainnet', async () => {
    fetchMock.mockResponse(JSON.stringify({ success: true }))

    new RyskSDK(privateKey, { environment: Environment.MAINNET })

    await vi.waitFor(() => {
      if (!fetchMock.mock.calls.length) throw new Error('Awaiting call...')
    })

    expect(fetchMock.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "https://api.rysk.finance/v1/referral/add-referee",
        {
          "body": "{"account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","code":"kickflip","signature":"0x67714f4bdbb30fc7c9471cfdb0112080762bb3eddb5d73be0dae0aad3ee4dd0a713ff5bce79b78f09d1eb1956fcf581e8c243bf74cbc2f19c9b2c4cf5303b3801c"}",
          "method": "POST",
        },
      ]
    `)
  })

  it('should handle referral failures gracefully', async () => {
    fetchMock.mockReject(new Error('An unknown error occurred'))

    const Client = new RyskSDK(privateKey, { debug: true, environment: Environment.MAINNET })

    await vi.waitFor(() => {
      if (Client.logs.length !== 4) throw new Error('Awaiting call...')
    })

    expect(Client.logs[3]).toEqual({ msg: 'Call failed, ignoring.' })
  })
})
