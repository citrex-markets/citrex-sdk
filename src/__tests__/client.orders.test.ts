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
            "body": "{"expiration":1712421770000,"nonce":1709829780000000,"price":"3536200000000000000000","quantity":"1000000000000000","signature":"0xa33dd7654df48204f91bda657f169fbc6ac75054054c04437ee172f0fd1f09dd41a20d58da3dbdad07a039fbb4d270c6571af03caf54552267bb9a4f4647f1841b","account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","isBuy":true,"orderType":2,"productId":1002,"subAccountId":1,"timeInForce":1}",
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
            "body": "{"expiration":1800000000000,"nonce":123,"price":"3450000000000000000000","quantity":"1000000000000000","signature":"0x40f46fa7142e20092fc02faf943852a958d2ad361dd5554dd5e985689c9a11902253f3ea69ac8b9591fb258c658ed204b6b88bd3c440788e6788c8b816575d541c","account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","isBuy":true,"orderType":0,"productId":1002,"subAccountId":1,"timeInForce":2}",
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
            "body": "{"account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","orderId":"0x3505c6219b1f51cf216e432b153f8637c1fa9342520bd7c780bd80dafe0eed94","productId":1002,"subAccountId":1,"signature":"0x0ac162f9cd29c1d4b82fb0ed40121daa3d3a24de74e3063c3f66a910c7bf1f9334c281110adf4e24045469a1ab25fa4aeed4f685f24ebbb790fb5067082503691b"}",
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
            "body": "{"account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","productId":1002,"subAccountId":1,"signature":"0x391d904d99756d15ccbe13a261b5deee964e1c586974fa9adce8b99a6a89c47804b615aa660de6011a3199714eeef4a3b838cca309e7f22c32fd8c2d97e12ae01b"}",
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
            "body": "{"idToCancel":"0x08d4079c501e5fbb2153c7fe785ea4648ffcdac411d93511edcb5b18aecc158f","newOrder":{"expiration":1712421760000,"nonce":1709829760000000,"price":"3455000000000000000000","quantity":"1000000000000000","signature":"0xed64cd393695d51be0c492ff4d313a0554ceb03791493564c5419b06cde72e684ebdc360481194b472d2e1a0e261db2163be2298552a39e6f4d8faca802e8ccc1c","account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","isBuy":true,"orderType":1,"productId":1002,"subAccountId":1,"timeInForce":0}}",
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
            "body": "{"idToCancel":"0x08d4079c501e5fbb2153c7fe785ea4648ffcdac411d93511edcb5b18aecc158f","newOrder":{"expiration":1800000000000,"nonce":123,"price":"3455000000000000000000","quantity":"1000000000000000","signature":"0xcda7ed8611f2d94e153a6efafa0c96e089f76cca5f9aa5b42f19a697d540ba5a2c06b640571ebd0c88407af4dcc60f291a4839f86d5bf975262e50a8eabf07ba1c","account":"0xb47B0b1e44B932Ae9Bb01817E7010A553A965Ea8","isBuy":true,"orderType":1,"productId":1002,"subAccountId":1,"timeInForce":0}}",
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
