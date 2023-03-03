import styled from '@emotion/styled'
import { useMemo } from 'react'
import { Box, BoxProps, Typography } from '@mui/material'
import dayjs, { Dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { roundToDecimals } from 'utils/number.util'
import { AuctionState } from 'interfaces/auction.interface'

dayjs.extend(relativeTime)

const CountdownProgress = styled(Box)<{ percentage: string }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(
    to left,
    transparent ${(props) => props.percentage}%,
    #5649e7 ${(props) => props.percentage}%
  );
  background-clip: padding-box;
  padding: 0.5rem 0.75rem !important;
`
type Props = {
  endTime: Dayjs
  now: Dayjs
  auctionState: AuctionState
  centerText?: boolean
} & BoxProps

export const CountdownBox = ({ endTime, now, auctionState, centerText, ...props }: Props) => {
  const [timeString, percentage] = useMemo(() => {
    const secondsDiff = endTime.diff(now, 'seconds')
    // const days = Math.floor(secondsDiff / 86400)
    const hours = Math.floor((secondsDiff % 86400) / 3600)
    const mins = Math.floor((secondsDiff % 3600) / 60)
    const secs = Math.floor(secondsDiff % 60)
    //
    const timeString =
      secondsDiff > 0
        ? `${`${hours}`.padStart(2, '0')}:${`${mins}`.padStart(2, '0')}:${`${secs}`.padStart(
            2,
            '0',
          )}`
        : 'Auction has ended!'
    const percentage = roundToDecimals((secondsDiff * 100) / 86400, 2)
    return [timeString, percentage]
  }, [now, endTime])

  return (
    <CountdownProgress
      {...props}
      className="nes-container is-rounded"
      percentage={auctionState == 'not_started' ? '100' : percentage.toString()}
      alignItems={centerText ? 'center' : 'flex-start'}
    >
      {auctionState === 'not_started' && <Typography variant="h5">--:--:--</Typography>}
      {auctionState === 'bidding' && (
        <Box>
          <Typography variant="caption">Ending In</Typography>
          <Typography variant="h5">{timeString}</Typography>
        </Box>
      )}
      {auctionState === 'ended' && <Typography fontSize={10}>Auction has ended!</Typography>}
      {auctionState === 'ready_for_settlement' && (
        <Typography variant="h5">Ready for settlement</Typography>
      )}
    </CountdownProgress>
  )
}
