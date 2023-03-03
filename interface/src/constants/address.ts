import { NetworkName } from './networks'

type Address = {
  marketplace: string
  nftAddress: string
}

export const addresses: Record<NetworkName, Address> = {
  local: {
    marketplace: '',
    nftAddress: ''
  },
  testnet: {
    marketplace: 'terra1qstyec40dz03zuwjmaj4v7ydy5sqhchsa7y7lhw40f4xjjlkxmjqpauzmr',
    nftAddress: 'terra13hn2zaa4zcu6tmsthqjl72z68fltxzfap43un7hhxr73lfftrtvqhgy4fx'
  },
  mainnet: {
    marketplace: 'terra1en087uygr8f57vdczvkhy9465t9y6su4ztq4u3',
    nftAddress: ''
  },
}
