import { useEffect, useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import dayjs, { Dayjs } from 'dayjs'
import numeral from 'numeral'
import big from 'big.js'
import { Box, Typography } from '@mui/material'
import { useWallet, useConnectedWallet, WalletStatus } from '@terra-money/wallet-provider'
import { CountdownBox } from 'components/CountdownBox'
import { CurrencyInput } from 'components/CurrencyInput'
import { useQueryService } from 'hooks/contract/useQueryService'
import { maskAddress } from 'utils/address.util'
import { denomToSymbol } from 'utils/currency.util'
import { parseAmount, formatAmount } from 'utils/number.util'
import { determineAuctionState } from 'utils/auction.util'
import { bidMultiplier } from 'constants/bid'
import { Auction, AuctionState, HistoricalBid } from 'interfaces/auction.interface'
import { Nft } from 'interfaces/nft.interface'
import { useExecuteService } from 'hooks/contract/useExecuteService'
import { useAuctionQuery } from 'hooks/contract/useAuctionQuery'
import { useResultPolling } from 'hooks/contract/useResultPolling'
import { BidHistory } from '../BidHistory'
import { auctionStateCaption } from 'constants/auctionStateComponent'
import { formatImageURL } from 'utils/image.util'
import { BuyNow } from '../BuyNow'
import { BidAmountForm } from '../BidAmountForm'

export const BidPage = () => {
  const [auctionState, setAuctionState] = useState<AuctionState>('not_started')
  const [isBidding, setIsBidding] = useState(false)
  const [endTime, setEndTime] = useState<Dayjs>(dayjs())
  const [nft, setNFT] = useState<Nft>()
  const [bidAmount, setBidAmount] = useState<number>()
  const [bidError, setBidError] = useState<string>()
  const [historicalBids, setHistoricalBids] = useState<HistoricalBid[]>([])

  const executeService = useExecuteService()

  const router = useRouter()
  const auctionId = router.query?.auctionId as string
  const auction = useAuctionQuery(auctionId, { polling: true })
  const { showTxSubmitted, pollTxInfo } = useResultPolling()

  const { status } = useWallet()
  const connectedWallet = useConnectedWallet()
  const isConnected = useMemo(() => status === WalletStatus.WALLET_CONNECTED, [status])
  const [now, setNow] = useState<Dayjs>(dayjs())
  const intervalRef = useRef<NodeJS.Timer | null>(null)

  const { queryNFT, queryBidHistoryByAuctionId, getNFTContract, queryNFTRoyaltyFee } = useQueryService()
  const backToHome = () => {
    router.push({
      pathname: '/',
    })
  }

  const increaseBid = (amount: any) => amount.mul(bidMultiplier)

  useEffect(() => {
    if (!router.isReady || !auction) return

    async function fetch() {
      // todo fetch nft data
      const nft = await queryNFT(getNFTContract(), auction?.token_id)
      setNFT(nft)

      const historicalBids = await queryBidHistoryByAuctionId(auctionId)
      historicalBids.sort((a, b) => parseInt(b?.time) - parseInt(a?.time))
      setHistoricalBids(historicalBids)
    }

    fetch()
  }, [router.isReady, auction])

  useEffect(() => {
    if (!auction) return
    const queryEndTime = dayjs(new Date(+auction?.end_time * 1000))
    setEndTime(queryEndTime)
  }, [auction])

  useEffect(() => {
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    intervalRef.current = setInterval(() => {
      if (endTime.unix() === 0 || !endTime) {
        cleanup()
      } else if (now.isAfter(endTime)) {
        cleanup()
      } else {
        setNow(dayjs().add(-1, 'second'))
      }

      setAuctionState(determineAuctionState(endTime, now, auction?.is_settled))
    }, 1000)
    return cleanup
  }, [endTime, auction])

  const handleBid = async () => {
    setIsBidding(true)

    if (
      bidAmount &&
      auctionState == 'not_started' &&
      big(bidAmount).mul(1e6).lt(parseAmount(auction?.amount))
    ) {
      setBidError('Bid amount too low.')
    } else if (
      !!bidAmount &&
      auctionState == 'bidding' &&
      big(bidAmount)
        .mul(1e6)
        .lt(increaseBid(parseAmount(auction?.amount)))
    ) {
      setBidError('Bid amount too low.')
    } else {
      setBidError('')
      try {
        const result = await executeService.placeBid(
          auctionId,
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

  const [royaltyFee, setRoyaltyFee] = useState(0)
  useEffect(() => {
    ;(async () => {
      let r = await queryNFTRoyaltyFee(auction?.nft_contract)
      setRoyaltyFee(+(r?.royalty_fee?.royalty_fee || 0) / 1000)
    })()
  }, [auction])

  const handleSettle = async () => {
    try {
      const result = await executeService.settle(auction.auction_id)
      const txHash = result?.result?.txhash
      if (txHash) {
        showTxSubmitted(txHash, 'Settle submitted')
        pollTxInfo(txHash, { successText: 'Settle success' })
      }
    } catch (err) {
      console.log(err)
    }
  }

  const SettleBox = ({ auction }: { auction: Auction }) => (
    <Box marginTop="30px">
      <button
        type="button"
        className="nes-btn is-warning"
        style={{ width: '100%' }}
        onClick={handleSettle}
      >
        Settle
      </button>
    </Box>
  )
  return (
    <Box>
      <Box onClick={backToHome}>
        <Typography variant="body1" style={{ cursor: 'pointer' }}>
          {'< Back'}
        </Typography>
      </Box>
      <Box display="flex" marginTop="32px">
        <Box
          width="60%"
          paddingRight="15px"
          style={{ filter: 'drop-shadow(0px 5px 20px rgba(73, 155, 231, 0.2))' }}
        >
          <Box className={`large`}>
            <Image src={formatImageURL(nft?.extension?.image)} alt="NFT" width="100%" height="100%" layout="responsive" />
          </Box>
        </Box>
        <Box width="40%" paddingLeft="15px">
          <Box display="flex" alignItems="center">
            <img src="/static/icons/rocket.png" style={{ width: 20, height: 20, marginRight: 6 }} />
            <Typography variant="subtitle1">{maskAddress(auction?.seller || '')}</Typography>
          </Box>
          <Box marginTop="18px">
            <Typography variant="h2">
              {nft?.extension?.name}
            </Typography>
            {nft &&
              nft?.extension?.attributes.length > 0 &&
              nft?.extension?.attributes.map((attr) => (
                <Box marginY={0.7} key={attr?.trait_type}>
                  <Typography fontSize={7}>{attr?.trait_type}</Typography>
                  <Typography
                    marginLeft="20px"
                  >
                    {attr?.value}
                  </Typography>
                </Box>
              ))}
          </Box>
          <Box display="flex" marginTop="24px" flexDirection="column">
            <Typography variant="subtitle1" style={{ color: '#fff' }}>
              {auctionStateCaption[auctionState]}
            </Typography>
            <Box display="flex" marginTop="10px" flexDirection="row" alignItems="center">
              {auction?.denom == 'uluna' && (
                <img
                  src="/static/icons/luna.png"
                  style={{ width: 48, height: 48, marginRight: 16 }}
                />
              )}
              <Typography variant="h2">
                {`${numeral(
                  big((auction?.amount || 0) as any)
                    .div(1e6)
                    .toString(),
                ).format('0,0.00')}`}
                {auction?.denom != 'uluna' && ` ${denomToSymbol(auction?.denom)}`}
              </Typography>
            </Box>
          </Box>
          {+auction?.duration !== 0 && (
            <Box marginTop="30px">
              <CountdownBox
                endTime={endTime}
                now={now}
                auctionState={auctionState}
                height={66}
                centerText
              />
              <Typography variant="caption">
                Extension time: {+auction?.extension_duration / 60} minutes
              </Typography>
              <Typography
                variant="caption"
                title={`If a bid is placed in the last ${
                  +auction?.extension_duration / 60
                } minutes, the auction will be extended for another ${
                  +auction?.extension_duration / 60
                } minutes.`}
              >
                (?)
              </Typography>
            </Box>
          )}
          {!isConnected && auctionState != 'ended' && (
            <Box marginTop="30px">
              <Typography variant="h3">Connect wallet to bid.</Typography>
            </Box>
          )}
          {isConnected &&
            auctionState != 'ended' &&
            auctionState != 'ready_for_settlement' &&
            auction?.bidder === connectedWallet.walletAddress && (
              <Box marginTop="30px">
                <Typography variant="h3">You are top bidder!</Typography>
              </Box>
            )}
          {isConnected &&
            auctionState != 'ended' &&
            auctionState != 'ready_for_settlement' &&
            auction?.bidder !== connectedWallet.walletAddress && (
              <>
                {+auction?.duration === 0 ? (
                  <BuyNow auction={auction} auctionState={auctionState} royaltyFee={royaltyFee} />
                ) : (
                  <BidAmountForm
                    auction={auction}
                    auctionState={auctionState}
                    royaltyFee={royaltyFee}
                  />
                )}
              </>
            )}
          {isConnected && auctionState == 'ready_for_settlement' && <SettleBox auction={auction} />}
          <Box marginTop="32px">
            <BidHistory bids={historicalBids} connectedWallet={connectedWallet} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
