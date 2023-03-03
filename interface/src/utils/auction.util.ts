import dayjs, { Dayjs } from 'dayjs'
import { AuctionState } from 'interfaces/auction.interface'

export const determineAuctionState = (endTime: Dayjs, now: Dayjs, isSettled: boolean): AuctionState => {
  if (endTime.unix() === 0) {
    return 'not_started'
  } if (now.isAfter(endTime) && !isSettled) {
    return 'ready_for_settlement'
  } if (now.isAfter(endTime)) {
    return 'ended'
  }
  return 'bidding'
}
