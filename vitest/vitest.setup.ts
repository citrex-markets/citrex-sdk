import { vi } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'

vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'log').mockImplementation(() => {})

const fetchMocker = createFetchMock(vi)
fetchMocker.enableMocks()

Object.defineProperty(BigInt.prototype, 'toJSON', {
  get() {
    'use strict'
    return () => String(this)
  },
})

vi.stubEnv('CIAO_MAINNET_ADDRESS', '0x71728FDDF90233cc35D61bec7858d7c42A310ACe')
vi.stubEnv('CIAO_TESTNET_ADDRESS', '0x71728FDDF90233cc35D61bec7858d7c42A310ACe')
vi.stubEnv('ORDER_DISPATCH_MAINNET_ADDRESS', '0x27809a3Bd3cf44d855f1BE668bFD16D34bcE157C')
vi.stubEnv('ORDER_DISPATCH_TESTNET_ADDRESS', '0x27809a3Bd3cf44d855f1BE668bFD16D34bcE157C')
