import { NetworkInfo } from '@terra-money/wallet-provider'

export type NetworkName = 'mainnet' | 'testnet' |  'local'

const mainnet: NetworkInfo = {
  name: 'mainnet',
  chainID: 'phoenix-1',
  lcd: 'https://phoenix-lcd.terra.dev',
  walletconnectID: 1
}

const testnet = {
  name: 'testnet',
  chainID: 'pisco-1',
  lcd: 'https://pisco-lcd.terra.dev',
  walletconnectID: 0
}

const local = {
  name: '',
  chainID: '',
  lcd: '',
  walletconnectID: 0
}

export const Networks: Record<NetworkName, NetworkInfo> = {
  mainnet,
  testnet,
  local
}

// WalletConnect separates chainId by number.
// Currently TerraStation Mobile uses 0 as Testnet, 1 as Mainnet.
export const walletConnectChainIds: Record<number, NetworkInfo> = {
  0: testnet,
  1: mainnet,
}
