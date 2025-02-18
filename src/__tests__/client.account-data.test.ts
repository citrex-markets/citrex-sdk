import type { HexString } from 'src/types'

import { recoverTypedDataAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CitrexSDK from 'src'
import EIP712 from 'src/ABI/EIP712'
import {
  address,
  mockAccountHealth,
  mockBalances,
  mockOpenOrders,
  mockPositions,
  privateKey,
} from 'vitest/utils'

describe('The CitrexSDK', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(1709829760000)
  })

  // describe('listBalances function', () => {
  //   it('should allow a user to fetch their balances', async () => {
  //     fetchMock.mockResponse(JSON.stringify(mockBalances))

  //     const Client = new CitrexSDK(privateKey)

  //     const result = await Client.listBalances()
  //     const call = fetchMock.mock.calls[0]

  //     expect(
  //       await recoverTypedDataAddress({
  //         domain: Client.domain,
  //         message: {
  //           account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
  //           subAccountId: 1,
  //         },
  //         primaryType: 'SignedAuthentication',
  //         signature: new URL(call[0] as string).searchParams.get('signature') as HexString,
  //         types: EIP712,
  //       }),
  //     ).toEqual(address)
  //     expect(call).toMatchInlineSnapshot(`
  //       [
  //         "https://api.staging.citrex.markets/v1/balances?account=0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8&signature=0x9e614af5ce7afc53fa791699a964bf2709ffa50643fa8401ee93fe2c4845c61337c19d5ac5f9619eff38f956fcce81ff76c7d5f34e76163fcdc9e93f8dfc875c1c&subAccountId=1",
  //         undefined,
  //       ]
  //     `)
  //     expect(result).toEqual({
  //       balances: [
  //         {
  //           address: '0xb8be1401e65dc08bfb8f832fc1a27a16ca821b05',
  //           asset: 'USDC',
  //           pendingWithdrawal: '0',
  //           quantity: '100000000000000000000',
  //         },
  //       ],
  //     })
  //   })

  //   it('should handle an error during the order process', async () => {
  //     fetchMock.mockResponse(JSON.stringify({ error: 'A known error occurred' }))

  //     const Client = new CitrexSDK(privateKey)

  //     const result = await Client.listBalances()

  //     expect(result).toEqual({
  //       balances: [],
  //       error: {
  //         message: 'A known error occurred',
  //       },
  //     })
  //   })

  //   it('should handle an unknown error', async () => {
  //     fetchMock.mockReject(new Error('An unknown error occurred'))

  //     const Client = new CitrexSDK(privateKey)

  //     const result = await Client.listBalances()

  //     expect(result).toEqual({
  //       balances: [],
  //       error: { message: 'An unknown error occurred. Try enabling debug mode for mode detail.' },
  //     })
  //   })
  // })

  describe('listPositions function', () => {
    it('should allow a user to fetch their positions', async () => {
      fetchMock.mockResponse(JSON.stringify(mockPositions))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.listPositions()
      const call = fetchMock.mock.calls[0]

      expect(
        await recoverTypedDataAddress({
          domain: Client.domain,
          message: {
            account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            subAccountId: 1,
          },
          primaryType: 'SignedAuthentication',
          signature: new URL(call[0] as string).searchParams.get('signature') as HexString,
          types: EIP712,
        }),
      ).toEqual(address)
      expect(call).toMatchInlineSnapshot(`
        [
          "https://api.staging.citrex.markets/v1/positionRisk?account=0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8&signature=0xfceac826840740869c72e2509e0a8d3eb2e99bd12b1fd016985b7961e0174fc53237774e1605d2bc7dea31a1a8a3f313dd4382b0ee5ca522a738ccb86853be171c&subAccountId=1",
          undefined,
        ]
      `)
      expect(result).toEqual({
        positions: [
          {
            account: '0x23a90125d8b71a6f18c905d1cce0579b3e589f90',
            subAccountId: 1,
            productId: 1002,
            productSymbol: 'ethperp',
            quantity: '200000000000000000',
            avgEntryPrice: '3015500000000000000000',
            initCumFunding: '-111231678929171498671',
            pnl: '-3304396381014467820',
            margin: '18093000000000000000',
            returnOnMargin: '<nil>',
            liquidationPrice: '2603153505535656747970',
            accruedFunding: '736486652336197441',
            markPrice: '2998978018094927660897',
            currentCumFunding: '-114914112190852485879',
          },
          {
            account: '0x23a90125d8b71a6f18c905d1cce0579b3e589f90',
            subAccountId: 1,
            productId: 1006,
            productSymbol: 'blastperp',
            quantity: '2000000000000000000',
            avgEntryPrice: '4800000000000000000',
            initCumFunding: '50840989198196999',
            pnl: '-167635635004808730',
            margin: '2400000000000000000',
            returnOnMargin: '<nil>',
            liquidationPrice: '0',
            accruedFunding: '0',
            markPrice: '4716182182497595635',
            currentCumFunding: '50840989198196999',
          },
        ],
      })
    })

    it('should allow a user to fetch their positions for a specified product symbol', async () => {
      fetchMock.mockResponse(JSON.stringify([mockPositions[1]]))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.listPositions('blastperp')
      const call = fetchMock.mock.calls[0]

      expect(call).toMatchInlineSnapshot(`
        [
          "https://api.staging.citrex.markets/v1/positionRisk?account=0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8&signature=0xfceac826840740869c72e2509e0a8d3eb2e99bd12b1fd016985b7961e0174fc53237774e1605d2bc7dea31a1a8a3f313dd4382b0ee5ca522a738ccb86853be171c&subAccountId=1&symbol=blastperp",
          undefined,
        ]
      `)
      expect(result).toEqual({
        positions: [
          {
            account: '0x23a90125d8b71a6f18c905d1cce0579b3e589f90',
            subAccountId: 1,
            productId: 1006,
            productSymbol: 'blastperp',
            quantity: '2000000000000000000',
            avgEntryPrice: '4800000000000000000',
            initCumFunding: '50840989198196999',
            pnl: '-167635635004808730',
            margin: '2400000000000000000',
            returnOnMargin: '<nil>',
            liquidationPrice: '0',
            accruedFunding: '0',
            markPrice: '4716182182497595635',
            currentCumFunding: '50840989198196999',
          },
        ],
      })
    })

    it('should handle an error during the order process', async () => {
      fetchMock.mockResponse(JSON.stringify({ error: 'A known error occurred' }))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.listPositions()

      expect(result).toEqual({
        error: {
          message: 'A known error occurred',
        },
        positions: [],
      })
    })

    it('should handle an unknown error', async () => {
      fetchMock.mockReject(new Error('An unknown error occurred'))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.listPositions()

      expect(result).toEqual({
        error: { message: 'An unknown error occurred. Try enabling debug mode for mode detail.' },
        positions: [],
      })
    })
  })

  describe('listOpenOrders function', () => {
    it('should allow a user to fetch their positions', async () => {
      fetchMock.mockResponse(JSON.stringify(mockOpenOrders))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.listOpenOrders()
      const call = fetchMock.mock.calls[0]

      expect(
        await recoverTypedDataAddress({
          domain: Client.domain,
          message: {
            account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            subAccountId: 1,
          },
          primaryType: 'SignedAuthentication',
          signature: new URL(call[0] as string).searchParams.get('signature') as HexString,
          types: EIP712,
        }),
      ).toEqual(address)
      expect(call).toMatchInlineSnapshot(`
        [
          "https://api.staging.citrex.markets/v1/openOrders?account=0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8&signature=0xfceac826840740869c72e2509e0a8d3eb2e99bd12b1fd016985b7961e0174fc53237774e1605d2bc7dea31a1a8a3f313dd4382b0ee5ca522a738ccb86853be171c&subAccountId=1",
          undefined,
        ]
      `)
      expect(result).toEqual({
        orders: [
          {
            id: '0x08d4079c501e5fbb2153c7fe785ea4648ffcdac411d93511edcb5b18aecc158fu',
            productId: 1006,
            productSymbol: 'blastperp',
            account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            subAccountId: 1,
            isBuy: true,
            orderType: 0,
            timeInForce: 0,
            price: '4698000000000000000',
            quantity: '6500000000000000000',
            nonce: 1712421760000,
            sender: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            signature:
              '0xeb1965e2504cadf99f13512273dbff1092fd514b4f7143d01e6f5939f5d0131775354ba3b0dd1a8c527fc1d2754e7a4868b934b93dde440e3d3d576212b5093e1c',
            expiry: 1712421760000,
            createdAt: 1712829961877,
            status: 'OPEN',
            residualQuantity: '6500000000000000000',
          },
          {
            id: '0x08d4079c501e5fbb2153c7fe785ea4648ffcdac411d93511edcb5b18aecc158f',
            productId: 1002,
            productSymbol: 'ethperp',
            account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            subAccountId: 1,
            isBuy: true,
            orderType: 1,
            timeInForce: 0,
            price: '3455000000000000000000',
            quantity: '1000000000000000',
            nonce: 1712421760000,
            sender: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            signature:
              '0x099fd784840218f0df8cf557e6a42ba8d26f6c8588a22b69f34f6d3e2705714a1d3bb8238a0a21ff824b77920691a7e926a02b2d8ebe8accf62895027b8417fd1c',
            expiry: 1712421760000,
            createdAt: 1712829961877,
            status: 'OPEN',
            residualQuantity: '1000000000000000',
          },
        ],
      })
    })

    it('should allow a user to fetch their positions for a specified product symbol', async () => {
      fetchMock.mockResponse(JSON.stringify([mockOpenOrders[1]]))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.listOpenOrders('blastperp')
      const call = fetchMock.mock.calls[0]

      expect(call).toMatchInlineSnapshot(`
        [
          "https://api.staging.citrex.markets/v1/openOrders?account=0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8&signature=0xfceac826840740869c72e2509e0a8d3eb2e99bd12b1fd016985b7961e0174fc53237774e1605d2bc7dea31a1a8a3f313dd4382b0ee5ca522a738ccb86853be171c&subAccountId=1&symbol=blastperp",
          undefined,
        ]
      `)
      expect(result).toEqual({
        orders: [
          {
            id: '0x08d4079c501e5fbb2153c7fe785ea4648ffcdac411d93511edcb5b18aecc158f',
            productId: 1002,
            productSymbol: 'ethperp',
            account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            subAccountId: 1,
            isBuy: true,
            orderType: 1,
            timeInForce: 0,
            price: '3455000000000000000000',
            quantity: '1000000000000000',
            nonce: 1712421760000,
            sender: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            signature:
              '0x099fd784840218f0df8cf557e6a42ba8d26f6c8588a22b69f34f6d3e2705714a1d3bb8238a0a21ff824b77920691a7e926a02b2d8ebe8accf62895027b8417fd1c',
            expiry: 1712421760000,
            createdAt: 1712829961877,
            status: 'OPEN',
            residualQuantity: '1000000000000000',
          },
        ],
      })
    })

    it('should handle an error during the order process', async () => {
      fetchMock.mockResponse(JSON.stringify({ error: 'A known error occurred' }))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.listOpenOrders()

      expect(result).toEqual({
        error: {
          message: 'A known error occurred',
        },
        orders: [],
      })
    })

    it('should handle an unknown error', async () => {
      fetchMock.mockReject(new Error('An unknown error occurred'))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.listOpenOrders()

      expect(result).toEqual({
        error: { message: 'An unknown error occurred. Try enabling debug mode for mode detail.' },
        orders: [],
      })
    })
  })

  describe('account health endpoint', () => {
    it('should allow a user to successfully get their account health', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          error: '',
          success: true,
          value: mockAccountHealth,
        }),
      )

      const Client = new CitrexSDK(privateKey)

      const result = await Client.getAccountHealth()

      expect(fetchMock.mock.calls[0][0]).toMatch(
        /.+\/account-health\?account=0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8&subAccountId=1$/,
      )
      expect(result).toEqual({
        accountHealth: {
          equity: '521853167994700001958',
          initialAccountMarginRatio: '29850665588517496',
          maintenanceAccountMarginRatio: '14925332794258748',
          initialHealth: '506275503590581770462',
          maintenanceHealth: '514064335792640886211',
          leverage: '20000000000000000000',
          totalPnl: '41880167994700001958',
          initialMarginUsed: '15577664404118231496',
          maintenanceMarginUsed: '7788832202059115748',
          initialMarginAvailable: '506275503590581770462',
          maintenanceMarginAvailable: '514064335792640886210',
          pendingWithdrawal: '40000000000000000000',
        },
      })
    })

    it('should handle an error during the process', async () => {
      fetchMock.mockResponse(JSON.stringify({ error: 'A known error occurred', success: false }))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.getAccountHealth()

      expect(result).toEqual({
        accountHealth: {},
        error: {
          message: 'A known error occurred',
        },
      })
    })

    it('should handle an unknown error', async () => {
      fetchMock.mockReject(new Error('An unknown error occurred'))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.getAccountHealth()

      expect(result).toEqual({
        accountHealth: {},
        error: { message: 'An unknown error occurred. Try enabling debug mode for mode detail.' },
      })
    })
  })
})
