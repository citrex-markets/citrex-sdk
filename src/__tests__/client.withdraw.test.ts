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
        "https://api.staging.citrex.markets/v1/withdraw",
        {
          "body": "{"account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","asset":"0x79A59c326C715AC2d31C169C85d1232319E341ce","subAccountId":1,"nonce":1709829760000000,"quantity":"100000000","signature":"0x212fc1a193b52599be7aa9fa3a203cb0b06522e739d3a828231ef5e1582cdd7f26c605b494e0faffe53646fca25d4f542541f3b04bc5653618fffe8c89b7e0e91c"}",
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
