import { recoverTypedDataAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HundredXClient from 'src'
import EIP712 from 'src/ABI/EIP712'
import { USDC, address, privateKey } from 'vitest/utils'

describe('The HundredXClient withdraw function', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(1709829760000)
  })

  it('should allow a user to successfully withdraw', async () => {
    fetchMock.mockResponse(JSON.stringify({ success: true }))

    const Client = new HundredXClient(privateKey)

    const result = await Client.withdraw(100)
    const call = fetchMock.mock.calls[0]

    expect(
      await recoverTypedDataAddress({
        domain: Client.domain,
        message: {
          account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
          asset: USDC,
          subAccountId: 1,
          nonce: 1709829760000000n,
          quantity: 100000000n,
        },
        primaryType: 'Withdraw',
        signature: JSON.parse(call[1]?.body as string).signature,
        types: EIP712,
      }),
    ).toEqual(address)
    expect(call).toMatchInlineSnapshot(`
      [
        "https://api.staging.rysk.finance/v1/withdraw",
        {
          "body": "{"account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","asset":"0xb8be1401e65dc08bfb8f832fc1a27a16ca821b05","subAccountId":1,"nonce":1709829760000000,"quantity":"100000000","signature":"0x101143e89f87141ea3ae19a1a9e97b1e940ab8e38ecde5886ac3a354746bf1e67a55495a8c172f78e07f49764e453f624b51bb7c808745618f5bfff4bcb652de1c"}",
          "method": "POST",
        },
      ]
    `)
    expect(result).toEqual({ success: true })
  })

  it('should handle an error during the withdrawal process', async () => {
    fetchMock.mockResponse(JSON.stringify({ error: 'A known error occurred' }))

    const Client = new HundredXClient(privateKey)

    const result = await Client.withdraw(100)

    expect(result).toEqual({
      error: {
        message: 'A known error occurred',
      },
      success: false,
    })
  })

  it('should handle an unknown error', async () => {
    fetchMock.mockReject(new Error('An unknown error occurred'))

    const Client = new HundredXClient(privateKey)

    const result = await Client.withdraw(100)

    expect(result).toEqual({
      error: { message: 'An unknown error occurred. Try enabling debug mode for mode detail.' },
      success: false,
    })
  })
})
