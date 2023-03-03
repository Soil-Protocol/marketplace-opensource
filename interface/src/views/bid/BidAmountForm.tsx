import big from 'big.js'
import { useState } from 'react'
import { Box, Typography } from '@mui/material'

import { CurrencyInput } from 'components/CurrencyInput'
import { bidMultiplier } from 'constants/bid'
import { useExecuteService } from 'hooks/contract/useExecuteService'
import { useResultPolling } from 'hooks/contract/useResultPolling'
import { Auction, AuctionState } from 'interfaces/auction.interface'
import { parseAmount, formatAmount } from 'utils/number.util'

export const BidAmountForm = ({
  auction,
  auctionState,
  royaltyFee,
}: {
  auction: Auction
  auctionState: AuctionState,
  royaltyFee: number
}) => {
  const [bidError, setBidError] = useState<string>()
  const [isBidding, setIsBidding] = useState(false)
  const [bidAmount, setBidAmount] = useState<number>()

  const executeService = useExecuteService()
  const { showTxSubmitted, pollTxInfo } = useResultPolling()

  const increaseBid = (amount: any) => amount.mul(bidMultiplier)

  const handleBid = async () => {
    setIsBidding(true)

    if (
      bidAmount &&
      auctionState == 'not_started' &&
      big(bidAmount)
        .mul(1e6)
        .lt(parseAmount(auction?.amount as any))
    ) {
      setBidError('Bid amount too low.')
    } else if (
      !!bidAmount &&
      auctionState == 'bidding' &&
      big(bidAmount)
        .mul(1e6)
        .lt(increaseBid(parseAmount(auction?.amount as any)))
    ) {
      setBidError('Bid amount too low.')
    } else {
      setBidError('')
      try {
        const result = await executeService.placeBid(
          auction.auction_id.toString(),
          big(bidAmount).mul(1e6).round(0, 0),
          auction?.denom,
        )
        const txHash = result?.result?.txhash
        if (txHash) {
          showTxSubmitted(txHash, 'Bid submitted')
          pollTxInfo(txHash, { successText: 'Bid Success' })
        }
      } catch (err) {
        console.error(err)
      }
    }

    setIsBidding(false)
  }

  return (
    <Box marginTop="30px">
      <Typography variant="subtitle1" style={{ color: '#fff' }}>
        Bid Amount (Minimum{' '}
        {auctionState == 'not_started'
          ? formatAmount(parseAmount(auction?.amount as any))
          : formatAmount(increaseBid(parseAmount(auction?.amount as any)))}
        )
      </Typography>
      <Box marginTop="8px" display="flex">
        <CurrencyInput value={bidAmount} denom="uluna" onChange={(e) => setBidAmount(e)} />
        <button
          type="button"
          className={`nes-btn is-success ${isBidding && 'is-disabled'}`}
          disabled={isBidding}
          onClick={handleBid}
          style={{
            marginLeft: 20,
            width: '100%',
            maxWidth: 150,
          }}
        >
          {isBidding ? 'Bidding' : 'Bid Now'}
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
