import { Nft } from "./nft.interface";

export interface AuctionIds {
  auctions: AuctionNft[]
}

export interface MinBidAmount {
  denom: string
  amount: string
}

export interface Auction extends MinBidAmount {
  auction_id: string
  nft_contract: string
  token_id: string
  seller: string
  duration: string
  extension_duration: string
  denom: string
  reserve_price: string
  end_time: string
  bidder: string
  amount: string
  is_settled: boolean
}

export interface HistoricalBid {
  auction_id: string
  bidder: string
  time: string
  denom: string
  amount: string

}

export interface RoyaltyFeeResponse {
  royalty_fee?: {
    royalty_fee: string
    creator: string
  }
}

export type AuctionState = 'not_started' | 'bidding' | 'ready_for_settlement' | 'ended'

export interface AuctionNft extends Auction, Nft {
  type : 'nft'
}

