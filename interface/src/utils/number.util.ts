import big from 'big.js'
import numeral from 'numeral'

export const roundToDecimals = (val: number, decimals = 0) => {
  return Math.round(val * 10 ** decimals) / 10 ** decimals
}

export const parseAmount = (amount: string) => {
  return big((amount || 0) as any)
}

export const formatAmount = (amount: any) => {
  return numeral(amount.div(1e6).toString()).format('0,0.00')
}
