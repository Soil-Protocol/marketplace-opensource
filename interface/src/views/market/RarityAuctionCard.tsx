import { useEffect, useRef, useState, useMemo } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import styled from '@emotion/styled'
import dayjs, { Dayjs } from 'dayjs'
import Image from 'next/image'
import { CountdownBox } from 'components/CountdownBox'
import { maskAddress } from 'utils/address.util'
import { Nft } from 'interfaces/nft.interface'
import { determineAuctionState } from 'utils/auction.util'
import { Auction, AuctionState } from 'interfaces/auction.interface'
import {
  auctionStateButton,
  auctionStateCaption,
  auctionStateColor,
} from 'constants/auctionStateComponent'
import { denomToSymbol } from 'utils/currency.util'
import { parseAmount, formatAmount } from 'utils/number.util'
import { useRouter } from 'next/router'
import { formatImageURL } from 'utils/image.util'

const StyledBox = styled(Box)`
  margin: 0 auto;
  max-width: 300px;
  background-color: #0c1044;
  border-radius: 30px;
  box-sizing: content-box;
  img {
    border-radius: 26px;
  }
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`
export const RarityAuctionCard = ({ auction, nft, isInstantSale }: { auction: Auction, nft: Nft, isInstantSale: boolean }) => {
  const [now, setNow] = useState<Dayjs>(dayjs())
  const [auctionState, setAuctionState] = useState<AuctionState>('not_started')
  const intervalRef = useRef<NodeJS.Timer | null>(null)
  const endTime = dayjs.unix(parseInt(auction.end_time))

  const router = useRouter()
  const goToAuction = () => {
    router.push(`/auction/${auction.auction_id}`)
  }

  useEffect(() => {
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    const intervalFn = () => {
      if (endTime.unix() === 0 || !endTime) {
        cleanup()
      } else if (now.isAfter(endTime)) {
        cleanup()
      } else {
        setNow(dayjs().add(-1, 'second'))
      }

      setAuctionState(determineAuctionState(endTime, now, auction?.is_settled))
    }

    intervalFn() // immediate execute once
    intervalRef.current = setInterval(intervalFn, 1000)
    return cleanup
  }, [])

  if (!nft) return null

  return (
    <StyledBox>
      <Box>
        <Box display="flex" flexDirection="column" height={270} overflow="hidden">
          <Image src={formatImageURL(nft?.extension?.image)} width={300} height={300} alt="" layout="responsive" />
        </Box>
        <Box display="flex" flexDirection="column" p={2} paddingBottom="0">
          <CountdownBox
            endTime={endTime}
            now={now}
            auctionState={auctionState}
            height={50}
            centerText
          />
          <br />
          <Box display="flex" alignItems="center" mb={1}>
            <img src="/static/icons/rocket.png" style={{ width: 20, height: 20, marginRight: 6 }} />
            <Typography variant="caption" color="primary">
              {maskAddress(auction.seller)}
            </Typography>
          </Box>
          <Typography variant="h5">{nft?.extension?.name}</Typography>
        </Box>
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        p={2}
        paddingTop="0"
      >
        <Box>
          <Typography variant="caption">{auctionStateCaption[auctionState]}</Typography>
          <Typography variant="h4">
            {formatAmount(parseAmount(auction?.amount))} {denomToSymbol(auction?.denom)}
          </Typography>
        </Box>
        <button
          type="button"
          className={`nes-btn ${auctionStateColor[auctionState]}`}
          disabled={auctionState === 'ended'}
          onClick={goToAuction}
        >
          {isInstantSale ? 'Buy Now' : auctionStateButton[auctionState]}
        </button>
      </Box>
    </StyledBox>
  )
}
