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

vi.stubEnv('CIAO_MAINNET_ADDRESS', '0x7461cFe1A4766146cAFce60F6907Ea657550670d')
vi.stubEnv('CIAO_TESTNET_ADDRESS', '0x0F571400ef7D2aEc68b29e58be3adCE1Bb27f33d')
vi.stubEnv('ORDER_DISPATCH_MAINNET_ADDRESS', '0x993543DC8BdFCba9fc7355d822108eF49dB6b9F9')
vi.stubEnv('ORDER_DISPATCH_TESTNET_ADDRESS', '0x24f4e9Db8225e6AE220FE89782E4A010aEB7bb14')
