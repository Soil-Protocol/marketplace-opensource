import axios from 'axios'
import { LCDClient } from '@terra-money/terra.js'
import { useConnectedWallet, useWallet } from '@terra-money/wallet-provider'
import { addresses } from 'constants/address'
import { Auction, AuctionIds, AuctionNft, HistoricalBid, MinBidAmount, RoyaltyFeeResponse } from 'interfaces/auction.interface'
import { Nft } from 'interfaces/nft.interface'
import { useCallback, useMemo } from 'react'

export const useQueryService = () => {
  const { network } = useWallet()
  const connectedWallet = useConnectedWallet()

  const lcdClient = useMemo(
    () =>
      new LCDClient({
        URL: network.lcd,
        chainID: network.chainID,
      }),
    [network],
  )

  const marketplace = useMemo(() => addresses[network.name].marketplace, [network])
  const nftAddress = useMemo(() => addresses[network.name].nftAddress, [network])

  function getNFTContract() {
    return nftAddress
  }

  const queryAuctionById = useCallback(
    async (auctionId: string) => {
      const response = await lcdClient.wasm.contractQuery<Auction>(marketplace, {
        auction: {
          auction_id: auctionId,
        },
      })
      return response
    },
    [network],
  )

  const queryNFT = useCallback(
    async (nft: string, tokenId: string) => {
      let response = await lcdClient.wasm.contractQuery<Nft>(nft, {
        nft_info: {
          token_id: tokenId,
        },
      })
      response.token_id = tokenId
      return response
    },
    [network],
  )

  const queryNFTByIds = useCallback(
    async (nft: string, tokenIds: string[]): Promise<Nft[]> =>
      Promise.all(tokenIds.map(async (tokenId) => queryNFT(nft, tokenId))),
    [network],
  )

  const queryBidHistoryByAuctionId = useCallback(
    async (auctionId: string) => {
      const response: any = await lcdClient.wasm.contractQuery<HistoricalBid[]>(marketplace, {
        bid_history_by_auction_id: {
          auction_id: auctionId,
        },
      })
      return response.bids 
    },
    [network],
  )

  const queryAuctionIdsBySeller = useCallback(
    async (seller: string, limit: number = 100) => {
      const response = await lcdClient.wasm.contractQuery<AuctionIds>(marketplace, {
        auction_by_seller: {
          seller,
          // ...(startAfter && { start_after: startAfter }),
          ...(limit && { limit }),
        },
      })
      const auctions = response.auctions
      return (
        await Promise.all(
          auctions.map(async (item) => {
            if (item.nft_contract == getNFTContract()) {
              return queryNFT(item.nft_contract, item.token_id)
            }
          }),
        )
      ).map((res, i) => ({
        ...res,
        ...auctions[i],
        type: auctions[i].nft_contract === getNFTContract() ? 'nft' : 'loot',
      }))
    },
    [network, connectedWallet],
  )


  const queryNftTokenIdsByAddress = useCallback(
    async (owner: string, nft: string) => {

      let tokenIds: string[] = []
      let isFirstTime = true
      let startAfter: string | undefined
      let limit = 30
      
      while (tokenIds.length == limit || isFirstTime) {
        const { tokens }: { tokens: string[] } = await lcdClient.wasm.contractQuery(nft, {
          tokens: {
            owner,
            limit: 30,
            ...(!!startAfter && { start_after: startAfter }),
          },
        })
        tokenIds = [...tokenIds, ...tokens]
      
        if(tokenIds.length === 0){
          break;
        }
        startAfter = tokenIds[tokenIds.length - 1]
        isFirstTime = false
      }
      return tokenIds
    },
    [network],
  )

  const queryStartedAuctionsByEndTime = useCallback(
    async (nftContract: string, endTime: number = 0, limit: number = 100, isDesc = false) => {
      const response = await lcdClient.wasm.contractQuery<{ auctions: Auction[] }>(marketplace, {
        auction_by_end_time: {
          nft_contract: nftContract,
          end_time: endTime,
          ...(limit && { limit }),
          ...(isDesc && { is_descending: isDesc }),
        },
      })
      return response
    },
    [network],
  )

  const queryNotStartedAuction = useCallback(
    async (nftContract: string, startAfter: string = '0', limit: number = 100, isDesc = false) => {
      const response = await lcdClient.wasm.contractQuery<{ auctions: Auction[] }>(marketplace, {
        not_started_auction: {
          nft_contract: nftContract,
          ...(startAfter && { start_after: startAfter }),
          ...(limit && { limit }),
          ...(isDesc && { is_descending: isDesc }),
        },
      })
      return response
    },
    [network],
  )

  const queryAuctionsByBidder = useCallback(
    async (bidder: string, startAfter: string = '0', limit: number = 100) => {
      const response = await lcdClient.wasm.contractQuery<AuctionIds>(marketplace, {
        auction_by_bidder: {
          bidder,
          ...(startAfter && { start_after: startAfter }),
          ...(limit && { limit }),
        },
      })
      const auctions = response.auctions

      return (
        await Promise.all(
          auctions.map(async (item) => {
            if (item.nft_contract == getNFTContract()) {
              return queryNFT(item.nft_contract, item.token_id)
            }
          }),
        )
      ).map((res, i) => ({
        ...res,
        ...auctions[i],
        type: auctions[i].nft_contract === getNFTContract() ? 'nft' : 'loot',
      }))
    },
    [network],
  )

  const queryNFTRoyaltyFee = useCallback(
    async (address: string) => {
      const response = await lcdClient.wasm.contractQuery<RoyaltyFeeResponse>(marketplace, {
        royalty_fee: {
          contract_addr: address
        },
      })
      return response
    },
    [network],
  )



  return {
    lcdClient,
    marketplace,
    nftAddress,
    queryAuctionById,
    queryBidHistoryByAuctionId,
    queryAuctionIdsBySeller,
    queryNFT,
    queryNFTByIds,
    queryNftTokenIdsByAddress,
    queryStartedAuctionsByEndTime,
    queryNotStartedAuction,
    getNFTContract,
    queryAuctionsByBidder,
    queryNFTRoyaltyFee
  }
}
