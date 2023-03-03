import { AuctionState } from 'interfaces/auction.interface'

export const auctionStateColor: { [name in AuctionState]: string } = {
  not_started: 'is-success',
  bidding: 'is-success',
  ready_for_settlement: 'is-success',
  ended: 'is-disabled',
}

export const auctionStateCaption: { [name in AuctionState]: string } = {
  not_started: 'Starting Price',
  bidding: 'Current Bid',
  ready_for_settlement: 'Final Price',
  ended: 'Final Price',
}

export const auctionStateButton: { [name in AuctionState]: string } = {
  not_started: 'Bid Now',
  bidding: 'Bid Now',
  ready_for_settlement: 'Settle',
  ended: 'Ended',
}
