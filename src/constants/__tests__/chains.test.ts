import { describe, expect, it } from 'vitest'

import CHAINS from '../chains'

describe('The CHAINS constant', () => {
  it('should stay unchanged', () => {
    expect(CHAINS).toMatchInlineSnapshot(`
      {
        "mainnet": {
          "blockExplorers": {
            "default": {
              "apiUrl": "https://seitrace.com/pacific-1/api",
              "name": "Seitrace",
              "url": "https://seitrace.com",
            },
          },
          "contracts": {
            "multicall3": {
              "address": "0xcA11bde05977b3631167028862bE2a173976CA11",
            },
          },
          "fees": undefined,
          "formatters": undefined,
          "id": 1329,
          "name": "Sei Network",
          "nativeCurrency": {
            "decimals": 18,
            "name": "Sei",
            "symbol": "SEI",
          },
          "rpcUrls": {
            "default": {
              "http": [
                "https://evm-rpc.sei-apis.com/",
              ],
              "webSocket": [
                "wss://evm-ws.sei-apis.com/",
              ],
            },
          },
          "serializers": undefined,
        },
        "testnet": {
          "blockExplorers": {
            "default": {
              "name": "Seitrace",
              "url": "https://seitrace.com",
            },
          },
          "fees": undefined,
          "formatters": undefined,
          "id": 1328,
          "name": "Sei Testnet",
          "nativeCurrency": {
            "decimals": 18,
            "name": "Sei",
            "symbol": "SEI",
          },
          "rpcUrls": {
            "default": {
              "http": [
                "https://evm-rpc-testnet.sei-apis.com",
              ],
              "webSocket": [
                "wss://evm-ws-testnet.sei-apis.com",
              ],
            },
          },
          "serializers": undefined,
          "testnet": true,
        },
      }
    `)
  })
})
