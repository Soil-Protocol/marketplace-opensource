import big from 'big.js'
import { useState } from 'react'
import { Box, Typography } from '@mui/material'

import { CurrencyInput } from 'components/CurrencyInput'
import { bidMultiplier } from 'constants/bid'
import { useExecuteService } from 'hooks/contract/useExecuteService'
import { useResultPolling } from 'hooks/contract/useResultPolling'
import { Auction, AuctionState } from 'interfaces/auction.interface'
import { parseAmount, formatAmount } from 'utils/number.util'

export const BuyNow = ({
  auction,
  auctionState,
  royaltyFee,
}: {
  auction: Auction
  auctionState: AuctionState
  royaltyFee: number
}) => {
  const [bidError, setBidError] = useState<string>()
  const bidAmount = auction.amount

  const executeService = useExecuteService()
  const { showTxSubmitted, pollTxInfo } = useResultPolling()

  const increaseBid = (amount: any) => amount.mul(bidMultiplier)

  const handleBid = async () => {
    setBidError('')
    try {
      const result = await executeService.buyNow(
        auction.auction_id.toString(),
        big(bidAmount).round(0, 0),
        auction?.denom,
      )
      const txHash = result?.result?.txhash
      if (txHash) {
        showTxSubmitted(txHash, 'Buy now submitted')
        pollTxInfo(txHash, { successText: 'Buy Success' })
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Box marginTop="30px">
      <Box marginTop="8px" display="flex" justifyContent="space-between">
        <button
          type="button"
          className={`nes-btn is-success`}
          onClick={handleBid}
          style={{
            width: '100%',
          }}
        >
          Buy Now
        </button>
      </Box>
      <Typography variant="caption">Royalty Fee: {royaltyFee.toFixed(2)} %</Typography>
      <Typography
        variant="subtitle1"
        className="nes-text is-error"
        style={{ marginTop: '7px', display: bidError ? 'block' : 'none' }}
      >
        {bidError}
      </Typography>
    </Box>
  )
}
