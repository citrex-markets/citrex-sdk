import { describe, expect, it } from 'vitest'

import CHAINS from '../chains'

describe('The CHAINS constant', () => {
  it('should stay unchanged', () => {
    expect(CHAINS).toMatchInlineSnapshot(`
      {
        "mainnet": {
          "blockExplorers": {
            "default": {
              "apiUrl": "https://api.arbiscan.io/api",
              "name": "Arbiscan",
              "url": "https://arbiscan.io",
            },
          },
          "contracts": {
            "multicall3": {
              "address": "0xca11bde05977b3631167028862be2a173976ca11",
              "blockCreated": 7654707,
            },
          },
          "fees": undefined,
          "formatters": undefined,
          "id": 42161,
          "name": "Arbitrum One",
          "nativeCurrency": {
            "decimals": 18,
            "name": "Ether",
            "symbol": "ETH",
          },
          "rpcUrls": {
            "default": {
              "http": [
                "https://arb1.arbitrum.io/rpc",
              ],
            },
          },
          "serializers": undefined,
        },
        "testnet": {
          "blockExplorers": {
            "default": {
              "apiUrl": "https://api-sepolia.arbiscan.io/api",
              "name": "Arbiscan",
              "url": "https://sepolia.arbiscan.io",
            },
          },
          "contracts": {
            "multicall3": {
              "address": "0xca11bde05977b3631167028862be2a173976ca11",
              "blockCreated": 81930,
            },
          },
          "fees": undefined,
          "formatters": undefined,
          "id": 421614,
          "name": "Arbitrum Sepolia",
          "nativeCurrency": {
            "decimals": 18,
            "name": "Arbitrum Sepolia Ether",
            "symbol": "ETH",
          },
          "rpcUrls": {
            "default": {
              "http": [
                "https://sepolia-rollup.arbitrum.io/rpc",
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
