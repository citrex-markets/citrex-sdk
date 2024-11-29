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
    Client.publicClient.uid = 'test-uid'
    expect(Client).toMatchSnapshot()
  })

  it('should initialise correctly with all config parameters passed', () => {
    const Client = new RyskSDK(privateKey, {
      debug: true,
      environment: Environment.TESTNET,
      rpc: 'https://test-rpc.quiknode.pro',
      subAccountId: 2,
    })
    Client.publicClient.uid = 'test-uid'
    expect(Client).toMatchSnapshot()
  })

  it('should POST the referral code if running on mainnet', async () => {
    fetchMock.mockResponse(JSON.stringify({ success: true }))

    new RyskSDK(privateKey, { environment: Environment.MAINNET })

    await vi.waitFor(() => {
      if (!fetchMock.mock.calls.length) throw new Error('Awaiting call...')
    })

    expect(fetchMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        "https://api.rysk.finance/v1/vault/referral",
        {
          "body": "{"account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","code":"kickflip"}",
          "method": "POST",
        },
      ]
    `)
  })

  it('should handle referral failures gracefully', async () => {
    fetchMock.mockReject(new Error('An unknown error occurred'))

    const Client = new RyskSDK(privateKey, { debug: true, environment: Environment.MAINNET })

    await vi.waitFor(() => {
      if (Client.logs.length !== 3) throw new Error('Awaiting call...')
    })

    expect(Client.logs[2]).toEqual({ msg: 'Call failed, ignoring.' })
  })
})
