import { recoverTypedDataAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CitrexSDK from 'src'
import EIP712 from 'src/ABI/EIP712'
import { TimeInForce, OrderType } from 'src/enums'
import { privateKey, address, marketFOKOrder, customOrder, replacementOrder } from 'vitest/utils'

describe('The CitrexSDK', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(1709829760000)
  })

  describe('placeOrder function', () => {
    it('should allow a user to successfully place a market order', async () => {
      fetchMock.mockResponse(JSON.stringify(marketFOKOrder))

      const Client = new CitrexSDK(privateKey)

      await vi.advanceTimersByTimeAsync(10000)

      const result = await Client.placeOrder({
        isBuy: true,
        price: 3450,
        priceIncrement: 100000000000000000n,
        productId: 1002,
        quantity: 0.001,
      })
      const call = fetchMock.mock.calls[0]

      expect(
        await recoverTypedDataAddress({
          domain: Client.domain,
          message: {
            account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            isBuy: true,
            expiration: 1712421770000n,
            nonce: 1709829780000000n,
            orderType: 2,
            price: 3536200000000000000000n,
            productId: 1002,
            quantity: 1000000000000000n,
            subAccountId: 1,
            timeInForce: 1,
          },
          primaryType: 'Order',
          signature: JSON.parse(call[1]?.body as string).signature,
          types: EIP712,
        }),
      ).toEqual(address)
      expect(call).toMatchInlineSnapshot(`
        [
          "https://api.staging.citrex.markets/v1/order",
          {
            "body": "{"expiration":1712421770000,"nonce":1709829780000000,"price":"3536200000000000000000","quantity":"1000000000000000","signature":"0x91e1b9439cae06a953d42cd053f347d20c7983d2f9e55d1669b1395d26e0f1e35d00f0d1484f9719717cf3d8c1ad8f689e1a70fe5877ca11fbe5639ebe4421431c","account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","isBuy":true,"orderType":2,"productId":1002,"subAccountId":1,"timeInForce":1}",
            "method": "POST",
          },
        ]
      `)
      expect(result).toEqual({
        order: marketFOKOrder,
      })
    })

    it('should allow a user to successfully place an order with all args passed (limit order)', async () => {
      fetchMock.mockResponse(JSON.stringify(customOrder))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.placeOrder({
        expiration: 1800000000000,
        isBuy: true,
        nonce: 123,
        orderType: OrderType.LIMIT,
        price: 3450,
        productId: 1002,
        quantity: 0.001,
        timeInForce: TimeInForce.IOC,
      })
      const call = fetchMock.mock.calls[0]

      expect(
        await recoverTypedDataAddress({
          domain: Client.domain,
          message: {
            account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            isBuy: true,
            expiration: 1800000000000n,
            nonce: 123n,
            orderType: 0,
            price: 3450000000000000000000n,
            productId: 1002,
            quantity: 1000000000000000n,
            subAccountId: 1,
            timeInForce: 2,
          },
          primaryType: 'Order',
          signature: JSON.parse(call[1]?.body as string).signature,
          types: EIP712,
        }),
      ).toEqual(address)
      expect(call).toMatchInlineSnapshot(`
        [
          "https://api.staging.citrex.markets/v1/order",
          {
            "body": "{"expiration":1800000000000,"nonce":123,"price":"3450000000000000000000","quantity":"1000000000000000","signature":"0x9ad73dd4860cb4d279b70df56e198c2ec4a3051ffc496118530a7fe2c539de822963652118bfb7763169ecc9900062a15cbdfdc780436ee17761845218929b6c1c","account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","isBuy":true,"orderType":0,"productId":1002,"subAccountId":1,"timeInForce":2}",
            "method": "POST",
          },
        ]
      `)
      expect(result).toEqual({
        order: customOrder,
      })
    })

    it('should allow a user to specify slippage', async () => {
      fetchMock.mockResponse(JSON.stringify(marketFOKOrder))

      const Client = new CitrexSDK(privateKey)

      await Client.placeOrder({
        isBuy: true,
        price: 3450,
        priceIncrement: 100000000000000000n,
        productId: 1002,
        quantity: 0.001,
        slippage: 1,
      })
      await Client.placeOrder({
        isBuy: false,
        price: 3450,
        priceIncrement: 100000000000000000n,
        productId: 1002,
        quantity: 0.001,
        slippage: 1.25,
      })

      const buyPrice = JSON.parse(fetchMock.mock.calls[0][1]?.body as string).price
      const sellPrice = JSON.parse(fetchMock.mock.calls[1][1]?.body as string).price

      expect(buyPrice).toEqual('3484500000000000000000')
      expect(sellPrice).toEqual('3406800000000000000000')
    })

    it('should return an error for a market order with no priceIncrement', async () => {
      const Client = new CitrexSDK(privateKey)

      const result = await Client.placeOrder({
        isBuy: true,
        price: 3450,
        productId: 1002,
        quantity: 0.001,
      })

      expect(result).toEqual({
        error: {
          message: 'A priceIncrement is required for market orders',
        },
        order: {},
      })
    })

    it('should handle an error during the order process', async () => {
      fetchMock.mockResponse(JSON.stringify({ error: 'A known error occurred' }))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.placeOrder({
        isBuy: true,
        price: 3450,
        priceIncrement: 100000000000000000n,
        productId: 1002,
        quantity: 0.001,
      })

      expect(result).toEqual({
        error: {
          message: 'A known error occurred',
        },
        order: {},
      })
    })

    it('should handle an unknown error', async () => {
      fetchMock.mockReject(new Error('An unknown error occurred'))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.placeOrder({
        isBuy: true,
        price: 3450,
        priceIncrement: 100000000000000000n,
        productId: 1002,
        quantity: 0.001,
      })

      expect(result).toEqual({
        error: { message: 'An unknown error occurred. Try enabling debug mode for mode detail.' },
        order: {},
      })
    })
  })

  describe('placeOrders function', () => {
    it('should allow a user to place multiple orders that are both successful and throw errors', async () => {
      fetchMock
        .mockOnce(JSON.stringify(marketFOKOrder))
        .mockOnce(JSON.stringify(customOrder))
        .mockOnce(JSON.stringify({ error: 'A known error occurred' }))
        .mockReject(new Error('An unknown error occurred'))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.placeOrders([
        {
          isBuy: true,
          price: 3450,
          priceIncrement: 100000000000000000n,
          productId: 1002,
          quantity: 0.001,
        },
        {
          expiration: 1800000000000,
          isBuy: true,
          nonce: 123,
          orderType: OrderType.LIMIT,
          price: 3450,
          productId: 1002,
          quantity: 0.001,
          timeInForce: TimeInForce.IOC,
        },
        {
          isBuy: true,
          price: 3450,
          productId: 1002,
          quantity: 0.001,
        },
        {
          isBuy: true,
          price: 3450,
          priceIncrement: 100000000000000000n,
          productId: 1002,
          quantity: 0.001,
        },
        {
          isBuy: true,
          price: 3450,
          priceIncrement: 100000000000000000n,
          productId: 1002,
          quantity: 0.001,
        },
      ])

      expect(result).toEqual([
        {
          order: marketFOKOrder,
        },
        {
          order: customOrder,
        },
        {
          error: {
            message: 'A priceIncrement is required for market orders',
          },
          order: {},
        },
        {
          error: {
            message: 'A known error occurred',
          },
          order: {},
        },
        {
          error: { message: 'An unknown error occurred. Try enabling debug mode for mode detail.' },
          order: {},
        },
      ])
    })
  })

  describe('cancelOrder function', () => {
    it('should allow a user to successfully cancel an order', async () => {
      fetchMock.mockResponse(JSON.stringify({ success: true }))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.cancelOrder(
        '0x3505c6219b1f51cf216e432b153f8637c1fa9342520bd7c780bd80dafe0eed94',
        1002,
      )
      const call = fetchMock.mock.calls[0]

      expect(
        await recoverTypedDataAddress({
          domain: Client.domain,
          message: {
            account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            orderId: '0x3505c6219b1f51cf216e432b153f8637c1fa9342520bd7c780bd80dafe0eed94',
            productId: 1002,
            subAccountId: 1,
          },
          primaryType: 'CancelOrder',
          signature: JSON.parse(call[1]?.body as string).signature,
          types: EIP712,
        }),
      ).toEqual(address)
      expect(call).toMatchInlineSnapshot(`
        [
          "https://api.staging.citrex.markets/v1/order",
          {
            "body": "{"account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","orderId":"0x3505c6219b1f51cf216e432b153f8637c1fa9342520bd7c780bd80dafe0eed94","productId":1002,"subAccountId":1,"signature":"0x9b853e8c36697d552c9ec976b3cb27ae95a65fccdf8ffd2af6d7b5617ef7dd0046ee99e34165c593d22187ecda835c931a7ea6567e098b49afe388e83f604bb81c"}",
            "method": "DELETE",
          },
        ]
      `)
      expect(result).toEqual({ success: true })
    })

    it('should handle an error during the cancel process', async () => {
      fetchMock.mockResponse(JSON.stringify({ error: 'A known error occurred', success: false }))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.cancelOrder(
        '0x3505c6219b1f51cf216e432b153f8637c1fa9342520bd7c780bd80dafe0eed94',
        1002,
      )

      expect(result).toEqual({
        error: {
          message: 'A known error occurred',
        },
        success: false,
      })
    })

    it('should handle an unknown error', async () => {
      fetchMock.mockReject(new Error('An unknown error occurred'))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.cancelOrder(
        '0x3505c6219b1f51cf216e432b153f8637c1fa9342520bd7c780bd80dafe0eed94',
        1002,
      )

      expect(result).toEqual({
        error: { message: 'An unknown error occurred. Try enabling debug mode for mode detail.' },
        success: false,
      })
    })
  })

  describe('cancelOrders function', () => {
    it('should allow a user to cancel multiple orders that are both successful and throw errors', async () => {
      fetchMock
        .mockOnce(JSON.stringify({ success: true }))
        .mockOnce(JSON.stringify({ error: 'A known error occurred', success: false }))
        .mockReject(new Error('An unknown error occurred'))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.cancelOrders([
        ['0x3505c6219b1f51cf216e432b153f8637c1fa9342520bd7c780bd80dafe0eed94', 1002],
        ['0x3505c6219b1f51cf216e432b153f8637c1fa9342520bd7c780bd80dafe0eed94', 1002],
        ['0x3505c6219b1f51cf216e432b153f8637c1fa9342520bd7c780bd80dafe0eed94', 1002],
      ])

      expect(result).toEqual([
        {
          success: true,
        },
        {
          error: {
            message: 'A known error occurred',
          },
          success: false,
        },
        {
          error: { message: 'An unknown error occurred. Try enabling debug mode for mode detail.' },
          success: false,
        },
      ])
    })
  })

  describe('cancelOpenOrdersForProduct function', () => {
    it('should allow a user to successfully cancel all orders for a product', async () => {
      fetchMock.mockResponse(JSON.stringify({ success: true }))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.cancelOpenOrdersForProduct(1002)
      const call = fetchMock.mock.calls[0]

      expect(
        await recoverTypedDataAddress({
          domain: Client.domain,
          message: {
            account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            productId: 1002,
            subAccountId: 1,
          },
          primaryType: 'CancelOrders',
          signature: JSON.parse(call[1]?.body as string).signature,
          types: EIP712,
        }),
      ).toEqual(address)
      expect(call).toMatchInlineSnapshot(`
        [
          "https://api.staging.citrex.markets/v1/openOrders",
          {
            "body": "{"account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","productId":1002,"subAccountId":1,"signature":"0xe345347384b5fbfa507fccf2d497e87ff5096d00370a793f5639e1897325a629598c0ec53e8fb2f56b32d1b35c65e9c8ac69a2354be724255ac11b1285a1ff111c"}",
            "method": "DELETE",
          },
        ]
      `)
      expect(result).toEqual({ success: true })
    })

    it('should handle an error during the cancel process', async () => {
      fetchMock.mockResponse(JSON.stringify({ error: 'A known error occurred', success: false }))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.cancelOpenOrdersForProduct(1002)

      expect(result).toEqual({
        error: {
          message: 'A known error occurred',
        },
        success: false,
      })
    })

    it('should handle an unknown error', async () => {
      fetchMock.mockReject(new Error('An unknown error occurred'))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.cancelOpenOrdersForProduct(1002)

      expect(result).toEqual({
        error: { message: 'An unknown error occurred. Try enabling debug mode for mode detail.' },
        success: false,
      })
    })
  })

  describe('cancelAndReplaceOrder function', () => {
    it('should allow a user to cancel and replace an order', async () => {
      fetchMock.mockResponse(JSON.stringify(replacementOrder))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.cancelAndReplaceOrder(replacementOrder.id, {
        isBuy: true,
        price: 3455,
        productId: 1002,
        quantity: 0.001,
      })
      const call = fetchMock.mock.calls[0]

      expect(
        await recoverTypedDataAddress({
          domain: Client.domain,
          message: {
            account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            isBuy: true,
            expiration: 1712421760000n,
            nonce: 1709829760000000n,
            orderType: 1,
            price: 3455000000000000000000n,
            productId: 1002,
            quantity: 1000000000000000n,
            subAccountId: 1,
            timeInForce: 0,
          },
          primaryType: 'Order',
          signature: JSON.parse(call[1]?.body as string).newOrder.signature,
          types: EIP712,
        }),
      ).toEqual(address)
      expect(call).toMatchInlineSnapshot(`
        [
          "https://api.staging.citrex.markets/v1/order/cancel-and-replace",
          {
            "body": "{"idToCancel":"0x08d4079c501e5fbb2153c7fe785ea4648ffcdac411d93511edcb5b18aecc158f","newOrder":{"expiration":1712421760000,"nonce":1709829760000000,"price":"3455000000000000000000","quantity":"1000000000000000","signature":"0x7a98ea451d77e3ca9afeb0e2f06a453ccf7b21bed672ec01ea3120179f3323e431202011d3d4cfa40778361cd65cca345bdd31bf451816d72eba64256b30d9331c","account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","isBuy":true,"orderType":1,"productId":1002,"subAccountId":1,"timeInForce":0}}",
            "method": "POST",
          },
        ]
      `)
      expect(result).toEqual({
        order: {
          account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
          createdAt: 1712829961877,
          expiry: 1712421760000,
          id: '0x08d4079c501e5fbb2153c7fe785ea4648ffcdac411d93511edcb5b18aecc158f',
          isBuy: true,
          nonce: 1712421760000,
          orderType: 1,
          price: '3455000000000000000000',
          productId: 1002,
          productSymbol: 'ethperp',
          quantity: '1000000000000000',
          residualQuantity: '1000000000000000',
          sender: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
          signature:
            '0x099fd784840218f0df8cf557e6a42ba8d26f6c8588a22b69f34f6d3e2705714a1d3bb8238a0a21ff824b77920691a7e926a02b2d8ebe8accf62895027b8417fd1c',
          status: 'OPEN',
          subAccountId: 1,
          timeInForce: 0,
        },
      })
    })

    it('should allow a user to cancel and replace an order with all args passed', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ ...replacementOrder, expiry: 1800000000000, nonce: 123 }),
      )

      const Client = new CitrexSDK(privateKey)

      const result = await Client.cancelAndReplaceOrder(replacementOrder.id, {
        expiration: 1800000000000,
        isBuy: true,
        nonce: 123,
        price: 3455,
        productId: 1002,
        quantity: 0.001,
      })
      const call = fetchMock.mock.calls[0]

      expect(
        await recoverTypedDataAddress({
          domain: Client.domain,
          message: {
            account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
            isBuy: true,
            expiration: 1800000000000n,
            nonce: 123n,
            orderType: 1,
            price: 3455000000000000000000n,
            productId: 1002,
            quantity: 1000000000000000n,
            subAccountId: 1,
            timeInForce: 0,
          },
          primaryType: 'Order',
          signature: JSON.parse(call[1]?.body as string).newOrder.signature,
          types: EIP712,
        }),
      ).toEqual(address)
      expect(call).toMatchInlineSnapshot(`
        [
          "https://api.staging.citrex.markets/v1/order/cancel-and-replace",
          {
            "body": "{"idToCancel":"0x08d4079c501e5fbb2153c7fe785ea4648ffcdac411d93511edcb5b18aecc158f","newOrder":{"expiration":1800000000000,"nonce":123,"price":"3455000000000000000000","quantity":"1000000000000000","signature":"0x7005826f08fa8987ed8086e70368f49aeb39494aaca1b76be7ee703bb03387ef430d23d56f89005e268e7e83cf851a2d275915214d82227ce0e1e25330d8c43e1b","account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","isBuy":true,"orderType":1,"productId":1002,"subAccountId":1,"timeInForce":0}}",
            "method": "POST",
          },
        ]
      `)
      expect(result).toEqual({
        order: {
          account: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
          createdAt: 1712829961877,
          expiry: 1800000000000,
          id: '0x08d4079c501e5fbb2153c7fe785ea4648ffcdac411d93511edcb5b18aecc158f',
          isBuy: true,
          nonce: 123,
          orderType: 1,
          price: '3455000000000000000000',
          productId: 1002,
          productSymbol: 'ethperp',
          quantity: '1000000000000000',
          residualQuantity: '1000000000000000',
          sender: '0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8',
          signature:
            '0x099fd784840218f0df8cf557e6a42ba8d26f6c8588a22b69f34f6d3e2705714a1d3bb8238a0a21ff824b77920691a7e926a02b2d8ebe8accf62895027b8417fd1c',
          status: 'OPEN',
          subAccountId: 1,
          timeInForce: 0,
        },
      })
    })

    it('should handle an error during the cancel process', async () => {
      fetchMock.mockResponse(JSON.stringify({ error: 'A known error occurred', success: false }))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.cancelAndReplaceOrder(replacementOrder.id, {
        isBuy: true,
        price: 3455,
        productId: 1002,
        quantity: 0.001,
      })

      expect(result).toEqual({
        error: {
          message: 'A known error occurred',
        },
        order: {},
      })
    })

    it('should handle an unknown error', async () => {
      fetchMock.mockReject(new Error('An unknown error occurred'))

      const Client = new CitrexSDK(privateKey)

      const result = await Client.cancelAndReplaceOrder(replacementOrder.id, {
        isBuy: true,
        price: 3455,
        productId: 1002,
        quantity: 0.001,
      })

      expect(result).toEqual({
        error: { message: 'An unknown error occurred. Try enabling debug mode for mode detail.' },
        order: {},
      })
    })
  })
})
