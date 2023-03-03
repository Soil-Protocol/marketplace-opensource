import React, { useState, useEffect, useMemo } from 'react'
import { useConnectedWallet, useWallet } from '@terra-money/wallet-provider'
import { useQueryService } from './contract/useQueryService'
import { addresses } from 'constants/address'
import { Nft } from 'interfaces/nft.interface'
import { Auction, AuctionNft } from 'interfaces/auction.interface'
import { determineAuctionState } from 'utils/auction.util'
import dayjs from 'dayjs'


export const useQueryMyNft = () => {
  const connectedWallet = useConnectedWallet()
  const { network } = useWallet()
  const [nfts, setNFTs] = useState<Nft[]>([])
  const { queryNftTokenIdsByAddress, queryNFTByIds } = useQueryService()

  const nft = useMemo(() => addresses[network.name].nftAddress, [network])

  useEffect(() => {
    if (!connectedWallet?.walletAddress) return
    async function fetch() {
      // TODO
      const allTokenIds = await queryNftTokenIdsByAddress(connectedWallet.walletAddress, nft)
      setNFTs(await queryNFTByIds(nft, allTokenIds))
    }
    fetch()
  }, [connectedWallet])

  return nfts
}

export const useQueryMySelling = () => {
  const connectedWallet = useConnectedWallet()
  const [selling, setSelling] = useState<AuctionNft[]>([])
  const { queryAuctionIdsBySeller, queryNFT, getNFTContract } = useQueryService()

  useEffect(() => {
    if (!connectedWallet?.walletAddress) return
    async function fetch() {
      const auctions = await queryAuctionIdsBySeller(connectedWallet.walletAddress)
      setSelling(auctions as any)
    }
    fetch()
  }, [connectedWallet])
  return selling
}

export const useQueryMyWaitingNft = () => {
  const connectedWallet = useConnectedWallet()
  const [waitingNfts, setWaitingNfts] = useState<AuctionNft[]>([])
  const { queryAuctionsByBidder } = useQueryService()
  useEffect(() => {
    if (!connectedWallet?.walletAddress) return
    async function fetch() {
      const result = await queryAuctionsByBidder(connectedWallet.walletAddress)
      setWaitingNfts(result as any)
    }
    fetch()
  }, [connectedWallet])
  return waitingNfts
}
