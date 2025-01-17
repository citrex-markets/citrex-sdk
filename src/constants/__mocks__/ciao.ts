import type { Environment, HexString } from 'src/types'

const CIAO_ADDRESS = {
  mainnet: '0x7461cFe1A4766146cAFce60F6907Ea657550670d',
  testnet: '0x0F571400ef7D2aEc68b29e58be3adCE1Bb27f33d',
} as Record<Environment, HexString>

export default CIAO_ADDRESS
