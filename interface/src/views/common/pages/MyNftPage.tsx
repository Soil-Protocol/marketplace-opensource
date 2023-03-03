import dayjs from 'dayjs'
import { Box, Grid, Typography } from '@mui/material'
import { useQueryService } from 'hooks/contract/useQueryService'
import { AuctionNft } from 'interfaces/auction.interface'
import { Nft } from 'interfaces/nft.interface'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useState, useEffect, useMemo } from 'react'
import { determineAuctionState } from 'utils/auction.util'
import { useExecuteService } from 'hooks/contract/useExecuteService'
import {
  useQueryMyNft,
  useQueryMySelling,
  useQueryMyWaitingNft,
} from 'hooks/useMyNft'
import { useConnectedWallet } from '@terra-money/wallet-provider'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { useResultPolling } from 'hooks/contract/useResultPolling'
import { KnowhereTab, KnowhereTabs, TabPanel } from '../KnowhereTab'
import { EmptyState } from '../EmptyState'
import { maskAddress } from 'utils/address.util'
import { formatImageURL } from 'utils/image.util'

enum TabIndex {
  NFT,
  Selling,
  Claim,
}
const NftButton = ({
  nft,
  type,
}: {
  type: 'nft'
  nft: Nft | AuctionNft
}) => {
  const router = useRouter()
  const auctionState =
    'end_time' in nft &&
    determineAuctionState(dayjs(new Date(+nft.end_time * 1000)), dayjs(), nft?.is_settled)
  const readyToSettle = auctionState === 'ready_for_settlement'
  const isSettled = 'is_settled' in nft ? nft?.is_settled : false
  const isListing = auctionState === 'not_started' || auctionState === 'bidding'

  const { delist } = useExecuteService()
  const { showTxSubmitted, pollTxInfo } = useResultPolling()

  const onSelling = () => {

    router.push(`/my-nft/${type}/${nft?.token_id}`)
  }

  const goToAuction = () => {
    if (!('auction_id' in nft)) return
    router.push(`/auction/${nft.auction_id}`)
  }

  const onDelist = async () => {
    if ('auction_id' in nft) {
      const result = await delist(nft.auction_id)
      const txHash = result?.result?.txhash
      if (txHash) {
        showTxSubmitted(txHash, 'Delisting...')
        pollTxInfo(txHash, { successText: 'Delist success' })
      }
    }
  }

  const renderButtonFromState = () => {
    if (isSettled) {
      return (
        <button
          type="button"
          className="nes-btn is-disable"
          style={{ width: '100%', height: '40px' }}
          disabled
        >
          <Typography>Settled</Typography>
        </button>
      )
    }
    if (readyToSettle) {
      return (
        <button
          type="button"
          className="nes-btn is-primary"
          style={{ width: '100%', height: '40px' }}
          onClick={goToAuction}
        >
          <Typography>Settle</Typography>
        </button>
      )
    }
    if (isListing) {
      return (
        <>
          <button
            type="button"
            className="nes-btn is-warning"
            style={{
              width: '40px',
              height: '40px',
              marginRight: '5px',
              color: 'white',
            }}
            onClick={goToAuction}
          >
            <Box style={{ marginTop: '-10px' }}>
              <FontAwesomeIcon icon={faExternalLinkAlt} />
            </Box>
          </button>
          <button
            type="button"
            className={`nes-btn ${auctionState === 'not_started' ? 'is-error' : 'is-disabled'}`}
            style={{ width: '100%', height: '40px', marginLeft: '5px' }}
            onClick={onDelist}
            disabled={auctionState !== 'not_started'}
          >
            <Typography>Delist</Typography>
          </button>
        </>
      )
    }
    return (
      <button
        type="button"
        className="nes-btn is-success"
        style={{ width: '100%', height: '40px' }}
        onClick={onSelling}
      >
        <Typography>Sell now</Typography>
      </button>
    )
  }
  return (
    <Box
      display="flex"
      flexDirection="column"
      paddingX={3}
      paddingY={2}
      style={{ gap: '8px' }}
      flex={1}
    >
      <Box flex={1} display="flex" alignItems="flex-end">
        {renderButtonFromState()}
      </Box>
    </Box>
  )
}

const NftCard = ({ nft }: { nft: Nft | AuctionNft }) => {
  const rarityName = useMemo(() => {
    return 'common'
  }, [nft])

  const connectedWallet = useConnectedWallet()
  return (
    <Box
      display="flex"
      flexDirection="column"
      borderRadius="30px"
      height="100%"
      overflow="hidden"
      className={`${rarityName}`}
    >
      <Box display="flex" flexDirection="column" height={270} overflow="hidden">
        <Image src={formatImageURL(nft?.extension?.image)} width={300} height={300} alt="" layout="responsive" />
      </Box>
      <Box display="flex" flexDirection="column" p={2} paddingBottom="0">
        <Box display="flex" alignItems="center" mb={1}>
          <img src="/static/icons/rocket.png" style={{ width: 20, height: 20, marginRight: 6 }} />
          <Typography variant="caption" color="primary">
            {maskAddress(connectedWallet?.walletAddress ?? '')}
          </Typography>
        </Box>
        <Typography variant="h5">{nft?.extension?.name}</Typography>
      </Box>
      <NftButton nft={nft} type="nft" />
    </Box>
  )
}

export const MyNft = () => {
  const [value, setValue] = useState(TabIndex.NFT)
  const nfts = useQueryMyNft()
  const selling = useQueryMySelling()
  const waitingNfts = useQueryMyWaitingNft()
  
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  return (
    <Box>
      <Typography variant="h1" color="textPrimary" component="div">
        My NFT
      </Typography>
      <Box marginTop={2}>
        <KnowhereTabs value={value} onChange={handleChange}>
          <KnowhereTab value={TabIndex.NFT} label="NFT" />
          <KnowhereTab value={TabIndex.Selling} label="Selling" />
          <KnowhereTab value={TabIndex.Claim} label="Claim Your NFT" />
        </KnowhereTabs>
        <Box marginTop={4}>
          <TabPanel value={value} index={TabIndex.NFT}>
            <Grid container spacing={3.5}>
              {nfts.map((data) => (
                <Grid key={data?.token_id} item xs={6} md={3}>
                  <NftCard nft={data} />
                </Grid>
              ))}
              {nfts.length === 0 && <EmptyState />}
            </Grid>
          </TabPanel>
          <TabPanel value={value} index={TabIndex.Selling}>
            <Grid container spacing={3.5}>
              {selling.map((data) => (
                <Grid key={data.token_id} item xs={6} md={3}>
                  <NftCard nft={data as AuctionNft} />
                </Grid>
              ))}
              {selling.length === 0 && <EmptyState />}
            </Grid>
          </TabPanel>
          <TabPanel value={value} index={TabIndex.Claim}>
            <Grid container spacing={3.5}>
              {waitingNfts.map((data) => (
                <Grid key={data.token_id} item xs={6} md={3}>
                  <NftCard nft={data as AuctionNft} />
                </Grid>
              ))}
              {waitingNfts.length === 0 && <EmptyState />}
            </Grid>
          </TabPanel>
        </Box>
      </Box>
    </Box>
  )
}
