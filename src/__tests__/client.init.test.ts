import { beforeEach, describe, expect, it, vi } from 'vitest'

import CitrexSDK from 'src'
import { Environment } from 'src/enums'
import { privateKey } from 'vitest/utils'

const mocks = vi.hoisted(() => ({
  createPublicClient: vi.fn().mockReturnValue({}),
}))

vi.mock('viem', async () => {
  const actual = (await vi.importActual('viem')) as any

  return {
    ...actual,
    createPublicClient: mocks.createPublicClient,
  }
})

describe('The CitrexSDK', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  it('should initialise correctly with only required params', () => {
    const Client = new CitrexSDK(privateKey)

    expect(Client).toMatchSnapshot()
  })

  it('should initialise correctly with all config parameters passed', () => {
    const Client = new CitrexSDK(privateKey, {
      debug: true,
      environment: Environment.TESTNET,
      rpc: 'https://test-rpc.quiknode.pro',
      subAccountId: 2,
    })

    expect(Client).toMatchSnapshot()
  })

  it('should POST the referral code if running on mainnet', async () => {
    fetchMock.mockResponse(JSON.stringify({ success: true }))

    new CitrexSDK(privateKey, { environment: Environment.MAINNET })

    await vi.waitFor(() => {
      if (!fetchMock.mock.calls.length) throw new Error('Awaiting call...')
    })

    expect(fetchMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        "https://api.citrex.markets/v1/vault/referral",
        {
          "body": "{"account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","code":"kickflip"}",
          "method": "POST",
        },
      ]
    `)
  })

  it('should handle referral failures gracefully', async () => {
    fetchMock.mockReject(new Error('An unknown error occurred'))

    const Client = new CitrexSDK(privateKey, { debug: true, environment: Environment.MAINNET })

    await vi.waitFor(() => {
      if (Client.logs.length !== 3) throw new Error('Awaiting call...')
    })

    expect(Client.logs[2]).toEqual({ msg: 'Call failed, ignoring.' })
  })
})
