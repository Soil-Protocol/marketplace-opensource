import { MsgExecuteContract } from '@terra-money/terra.js'
import { useConnectedWallet, useWallet } from '@terra-money/wallet-provider'
import { addresses } from 'constants/address'
import { useCallback, useMemo } from 'react'
import { Nft } from 'interfaces/nft.interface'
import Big from 'big.js'

export const useExecuteService = () => {
  const { status, network } = useWallet()
  const connectedWallet = useConnectedWallet()

  const marketplace = useMemo(() => addresses[network.name].marketplace, [network])

  const executeExample = useCallback(async () => {
    if (!connectedWallet) return

    const { marketplace } = addresses[network.name]
    const response = await connectedWallet.post({
      msgs: [new MsgExecuteContract(connectedWallet.walletAddress, marketplace, {})],
    })
    return response
  }, [network, connectedWallet])

  const createAuction = useCallback(
    async (nft: Nft , reservePrice: Big, tokenAddress: string, tokenId: string, isInstantSale: boolean) => {
      if (!connectedWallet) return
      const response = await connectedWallet.post({
        msgs: [
          new MsgExecuteContract(connectedWallet.walletAddress, tokenAddress, {
            send_nft: {
              contract: marketplace,
              token_id: tokenId,
              msg: Buffer.from(
                JSON.stringify({
                  create_auction: {
                    denom: 'uluna',
                    reserve_price: reservePrice.toString(),
                    is_instant_sale: isInstantSale
                  },
                }),
              ).toString('base64'),
            },
          }),
        ],
      })
      return response
    },
    [network, connectedWallet],
  )

  const placeBid = useCallback(
    async (auctionId: string, bidAmount: Big, bidDenom: string) => {
      if (!connectedWallet) return

      const coins = { [bidDenom]: bidAmount.toString() }

      const response = await connectedWallet.post({
        msgs: [
          new MsgExecuteContract(
            connectedWallet.walletAddress,
            marketplace,
            {
              place_bid: {
                auction_id: auctionId,
              },
            },
            coins,
          ),
        ],
      })
      return response
    },
    [network, connectedWallet],
  )

  const buyNow = useCallback(
    async (auctionId: string, bidAmount: Big, bidDenom: string) => {
      if (!connectedWallet) return
      const coins = { [bidDenom]: bidAmount.toString() }

      const response = await connectedWallet.post({
        msgs: [
          new MsgExecuteContract(
            connectedWallet.walletAddress,
            marketplace,
            {
              place_bid: {
                auction_id: `${auctionId}`,
              },
            },
            coins,
          ),
          new MsgExecuteContract(connectedWallet.walletAddress, marketplace, {
            settle: {
              auction_id: `${auctionId}`,
            },
          }),
        ],
      })
      return response
    },
    [network, connectedWallet],
  )

  const settle = useCallback(
    async (auctionId: string) => {
      if (!connectedWallet) return

      const response = await connectedWallet.post({
        msgs: [
          new MsgExecuteContract(connectedWallet.walletAddress, marketplace, {
            settle: {
              auction_id: auctionId,
            },
          }),
        ],
      })
      return response
    },
    [network, connectedWallet],
  )

  const delist = useCallback(
    async (auctionId: string) => {
      if (!connectedWallet) return

      const response = await connectedWallet.post({
        msgs: [
          new MsgExecuteContract(connectedWallet.walletAddress, marketplace, {
            cancel_auction: {
              auction_id: auctionId,
            },
          }),
        ],
      })
      return response
    },
    [network, connectedWallet],
  )

  return { executeExample, placeBid, createAuction, settle, delist, buyNow }
}
