export type InkMethod = 'place_bid' | 'list'

export const gas: {
  [network: string]: {
    gasAdjustment: number
    defaultGasFee: number
    methods: { [methodName: string]: { gasLimit: number; gasFee: number } }
  }
} = {
  mainnet: {
    gasAdjustment: 1.6,
    defaultGasFee: 100000,
    methods: {
      place_bid: { gasLimit: 1000000, gasFee: 200000 },
      list: { gasLimit: 1000000, gasFee: 200000 },
    },
  },
  testnet: {
    gasAdjustment: 1.6,
    defaultGasFee: 100000,
    methods: {
      place_bid: { gasLimit: 1000000, gasFee: 200000 },
      list: { gasLimit: 1000000, gasFee: 200000 },
    },
  },
}
