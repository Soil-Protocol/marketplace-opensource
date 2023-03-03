import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Big from 'big.js'
import { Box, Typography } from '@mui/material'
import { CurrencyInput } from 'components/CurrencyInput'
import { useQueryService } from 'hooks/contract/useQueryService'
import { Nft } from 'interfaces/nft.interface'
import { useExecuteService } from 'hooks/contract/useExecuteService'
import { TxResult, useConnectedWallet } from '@terra-money/wallet-provider'
import { useResultPolling } from 'hooks/contract/useResultPolling'
import { formatImageURL } from 'utils/image.util'

export const SellMyNftPage = () => {
  const [nft, setNFT] = useState<Nft>()

  const [price, setPrice] = useState<number>()
  const [royaltyPercent, setRoyaltyPercent] = useState<string>()
  const [isInstantSale, setIsInstantSale] = useState<boolean>(false)
  const router = useRouter()
  const { type, tokenId } = router.query

  const backToHome = () => {
    router.push({
      pathname: '/my-nft',
    })
  }

  const connectedWallet = useConnectedWallet()

  const { queryNFT, queryNFTRoyaltyFee ,getNFTContract } = useQueryService()
  const { createAuction } = useExecuteService()
  const { showTxSubmitted, pollTxInfo, txInfo, polling, error } = useResultPolling()

  useEffect(() => {
    if (!type || !tokenId) return
    async function fetch() {
      const nftContract = getNFTContract()
      const _nft = await queryNFT(nftContract, tokenId as string)
      setNFT(_nft)
      const royaltyFee = await queryNFTRoyaltyFee(nftContract)
      const formattedRoyaltyFee = (+(royaltyFee?.royalty_fee?.royalty_fee || 0) / 1000).toFixed(2)
      setRoyaltyPercent(formattedRoyaltyFee)
    }
    fetch()
  }, [type, tokenId])

  const onSelling = async () => {
    const _price = new Big(price).mul(1e6).round(0, 0)
    let result: TxResult
    result = await createAuction(nft, _price, getNFTContract(), tokenId.toString(), isInstantSale)
    const txHash = result?.result?.txhash
    if (txHash) {
      showTxSubmitted(txHash, 'Creating Auction')
      pollTxInfo(txHash, { onSuccess: backToHome, successText: 'Auction Created' })
    }
  }

  const isOwner = () => {
    if (connectedWallet) {
      //check for nft owner
      return true
    }
    return false
  }

  // const royaltyFee = useMemo(() => {
  //   return (parseInt(nft?.royalty_percent_fee) || 0) / 1000
  // }, [nft])

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
          <Typography variant="h2" marginBottom="15px">
            Sell This NFT
          </Typography>

          <Box className={` large`}>
            <Image
              src={formatImageURL(nft?.extension?.image)}
              alt="NFT"
              width="100%"
              height="100%"
              layout="responsive"
              objectFit="contain"
            />
          </Box>
        </Box>
        <Box width="40%" paddingLeft="15px" marginY="auto">
          <Typography variant="h2">{nft?.extension?.name}</Typography>
          <Box marginTop="30px">
            <Typography variant="h4" style={{ color: '#fff' }}>
              Set Price
            </Typography>
            <Box marginY="10px" display="flex">
              <CurrencyInput value={price || ''} onChange={(e) => setPrice(e)} denom={'uluna'} />
            </Box>
            <Box>
              <label>
                <input
                  type="checkbox"
                  className="nes-checkbox is-dark"
                  checked={isInstantSale}
                  onClick={() => setIsInstantSale(!isInstantSale)}
                />
                <span>Sell Now (at fixed price above)</span>
              </label>
            </Box>
            {isInstantSale && (
              <Box
                className="nes-container is-rounded is-dark"
                style={{
                  background: 'transparent',
                }}
              >
                <Typography className="title nes-text is-error">Caution!</Typography>
                <Typography>Sell Now cannot be cancelled once bought.</Typography>
              </Box>
            )}
            {!isInstantSale && (
              <Box>
                <Box
                  className="nes-container is-rounded is-dark"
                  style={{
                    background: 'transparent',
                  }}
                >
                  <Typography className="title nes-text is-error">Caution!</Typography>
                  <Typography>Auction cannot be cancelled, once a bid is placed.</Typography>
                </Box>
                <Box
                  className="nes-container is-rounded is-dark"
                  style={{
                    background: 'transparent',
                  }}
                >
                  <Typography>
                    After receiving the first bid, the auction will be open for{' '}
                    <span color="#5649E7">24 hours</span>.
                  </Typography>
                </Box>
              </Box>
            )}
            <Typography style={{ margin: '16px 8px 0' }}>
              <b>Royalty Fee: {royaltyPercent}%</b>
            </Typography>
            {isOwner() && (
              <Box
                display="flex"
                flexDirection="column"
                paddingX={6}
                paddingY={2}
                style={{ gap: '8px' }}
                flex={1}
              >
                <Box flex={1} display="flex" alignItems="flex-end">
                  <button
                    type="button"
                    className="nes-btn is-success"
                    style={{ width: '100%', height: '40px' }}
                    onClick={onSelling}
                    disabled={price == 0 || !price}
                  >
                    <Typography>Sell Now</Typography>
                  </button>
                </Box>
                <Box flex={1} display="flex" alignItems="flex-end">
                  <button
                    type="button"
                    className="nes-btn"
                    style={{ width: '100%', height: '40px' }}
                    onClick={backToHome}
                  >
                    <Typography color="black">Cancel</Typography>
                  </button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
