import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  Box, Container, Grid, Pagination, Typography, Checkbox,
} from '@mui/material'
import { Auction } from 'interfaces/auction.interface'
import { Nft } from 'interfaces/nft.interface'
import { useQueryService } from 'hooks/contract/useQueryService'
import { determineAuctionState } from 'utils/auction.util'
import { KnowhereTab, KnowhereTabs, TabPanel } from 'views/common/KnowhereTab'
import { EmptyState } from 'views/common/EmptyState'
import styled from '@emotion/styled'
import { CheckBox, ArrowRightAlt } from '@mui/icons-material'
import { ls } from 'services/localStorage'
import { RarityAuctionCard } from '../RarityAuctionCard'

enum TabValue {
  NFT,
  // Other,
}

const BorderedBox = styled(Box)`
  border-radius: 0;
  border: 2px solid white;
`

const Divider = styled.div`
  width: 100%;
  margin: 1rem 0 2rem;
  border-top: 2px solid white;
`

const ArrowUpIcon = styled(ArrowRightAlt)<{ flip: string }>`
  transform: ${(props) => (props.flip === 'true' ? 'rotate(90deg)' : 'rotate(-90deg)')};
  color: white;
`

const StyledSelect = styled.select`
  display: flex;
  color: white;
  background: transparent;
  border: 2px solid white;
  font-size: 12px;
  height: 36px;
  padding: 0 1rem;
`

export const MarketPage = () => {
  const [value, setValue] = useState<TabValue>(
    parseInt(ls.get('tabValue', TabValue.NFT as unknown as string)),
  )
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [notStartedAuctions, setNotStartedAuctions] = useState<Auction[]>([])
  const [historicalAuctions, setHistoricalAuctions] = useState<Auction[]>([])
  const [auctionsNfts, setAuctionNfts] = useState<Record<string, Nft>>({})
  const [notStartedAuctionNfts, setNotStartedAuctionNfts] = useState<Record<string, Nft>>({})
  const [filterAuctions, setFilterAuctions] = useState<Auction[]>([])
  const [page, setPage] = useState(1)
  const [auctionState, setAuctionState] = useState<'all' | 'not_started' | 'in_progress'>(
    'in_progress',
  )
  const pageSize = 8
  const queryService = useQueryService()

  const isSettledOrEnded = (auction: Auction) => {
    const endTime = dayjs.unix(parseInt(auction.end_time))
    const auctionState = determineAuctionState(endTime, dayjs(), auction.is_settled)
    if (auctionState == 'ready_for_settlement') return true
    if (auctionState == 'ended') return true
    return false
  }

  const prepareAuction = (auctions: Auction[]): Auction[] => auctions.slice((page - 1) * pageSize, page * pageSize)
  const filterSettledAuction = (auctions: Auction[]): Auction[] => auctions.filter((auction) => !isSettledOrEnded(auction))
  const filterNotSettledAuction = (auctions: Auction[]): Auction[] => auctions.filter((auction) => isSettledOrEnded(auction))

  useEffect(() => {
    const prepareAuctions = async () => {
      let startAfter = dayjs().unix()
      let auctionId = null
      let allAuctions: Auction[] = []
      let notStarted: Auction[] = []
      const { nftAddress } = queryService
      
      while (true) {
        const { auctions } = await queryService.queryStartedAuctionsByEndTime(
          nftAddress,
          startAfter,
        )
        if (auctions.length === 0) break
        startAfter = +auctions[auctions.length - 1].end_time + 1
        allAuctions = [...allAuctions, ...auctions]
      }
      setAuctions(allAuctions)

      const nfts = {}
      await Promise.all(allAuctions.map(async (auction) => {
        const nft = await queryService.queryNFT(queryService.nftAddress, auction.token_id)
        nfts[auction.token_id] = nft
      }));
      setAuctionNfts(nfts)

      while (true) {
        const { auctions } = await queryService.queryNotStartedAuction(nftAddress, auctionId)
        if (auctions.length === 0) break
        auctionId = auctions[auctions.length - 1].auction_id
        notStarted = [...notStarted, ...auctions]
        break
      }

      const notStartedNfts = {}
      await Promise.all(notStarted.map(async (auction) => {
        const nft = await queryService.queryNFT(queryService.nftAddress, auction.token_id)
        notStartedNfts[auction.token_id] = nft
      }));
      setNotStartedAuctionNfts(notStartedNfts)

      setNotStartedAuctions(filterSettledAuction(notStarted))

      setFilterAuctions(prepareAuction(filterSettledAuction(allAuctions)))
    }

    prepareAuctions()
  }, [])

    // Sorting
    enum SortKey {
      Price = 'Price',
      EndTime = 'EndTime',
      LootId = 'LootId',
    }


  const [inProgressPage, setInProgressPage] = useState(1)
  const [notStartedPage, setNotStartedPage] = useState(1)
  const [historicalPage, setHistoricalPage] = useState(1)

  const [inProgressAuctionSortBy, _setInProgressAuctionSortBy] = useState<string>(
    ls.get('inProgressAuctionSortBy', SortKey.Price),
  )
  const setInProgressAuctionSortBy = (k: SortKey) => {
    ls.set('inProgressAuctionSortBy', k)
    _setInProgressAuctionSortBy(k)
  }
  const [notStartedAuctionSortBy, _setNotStartedAuctionSortBy] = useState<string>(
    ls.get('notStartedAuctionSortBy', SortKey.Price),
  )
  const setNotStartedAuctionSortBy = (k: SortKey) => {
    ls.set('notStartedAuctionSortBy', k)
    _setNotStartedAuctionSortBy(k)
  }
  const [historicalAuctionSortBy, _setHistoricalAuctionSortBy] = useState<string>(
    ls.get('historicalAuctionSortBy', SortKey.Price),
  )
  const setHistoricalAuctionSortBy = (k: SortKey) => {
    ls.set('historicalAuctionSortBy', k)
    _setNotStartedAuctionSortBy(k)
  }
  const [inProgressAuctionAsc, _setInProgressAuctionAsc] = useState(
    ls.get('inProgressAuctionAsc') === 'true',
  )
  const setInProgressAuctionAsc = (bool: boolean) => {
    ls.set('inProgressAuctionAsc', bool.toString())
    _setInProgressAuctionAsc(bool)
  }
  const [notStartedAuctionAsc, _setNotStartedAuctionAsc] = useState(
    ls.get('notStartedAuctionAsc') === 'true',
  )
  const setNotStartedAuctionAsc = (bool: boolean) => {
    ls.set('notStartedAuctionAsc', bool.toString())
    _setNotStartedAuctionAsc(bool)
  }
  const [historicalAuctionAsc, _setHistoricalAuctionAsc] = useState(
    ls.get('historicalAuctionAsc') === 'true',
  )
  const setHistoricalAuctionAsc = (bool: boolean) => {
    ls.set('historicalAuctionAsc', bool.toString())
    _setNotStartedAuctionAsc(bool)
  }

  const sortedInProgressAuction = useMemo(() => {
    const sorted = [...auctions]
    const r = inProgressAuctionAsc ? 1 : -1
    switch (inProgressAuctionSortBy) {
      case SortKey.Price:
        return sorted.sort((a, b) => r * (+a.amount - +b.amount))
      case SortKey.EndTime:
        return sorted.sort((a, b) => r * (+a.end_time - +b.end_time))
      case SortKey.LootId:
        return sorted.sort((a, b) => r * (+a.token_id - +b.token_id))
    }
  }, [auctions, inProgressAuctionSortBy, inProgressAuctionAsc])

  const pagedInProgressAuction = useMemo(
    () => sortedInProgressAuction.slice(
      (inProgressPage - 1) * pageSize,
      inProgressPage * pageSize,
    ),
    [sortedInProgressAuction, inProgressPage],
  )

  const sortedNotStartedAuction = useMemo(() => {
    const sorted = [...notStartedAuctions]
    const r = notStartedAuctionAsc ? 1 : -1
    switch (notStartedAuctionSortBy) {
      case SortKey.Price:
        return sorted.sort((a, b) => r * (+a.amount - +b.amount))
      case SortKey.EndTime:
        return sorted.sort((a, b) => r * (+a.end_time - +b.end_time))
      case SortKey.LootId:
        return sorted.sort((a, b) => r * (+a.token_id - +b.token_id))
    }
  }, [notStartedAuctions, auctions, notStartedAuctionSortBy, notStartedAuctionAsc])

  const pagedNotStartedAuction = useMemo(
    () => sortedNotStartedAuction.slice(
      (notStartedPage - 1) * pageSize,
      notStartedPage * pageSize,
    ),
    [sortedNotStartedAuction, notStartedPage],
  )

  const sortedHistoricalAuction = useMemo(() => {
    const sorted = [...historicalAuctions]
    const r = historicalAuctionAsc ? 1 : -1
    switch (historicalAuctionSortBy) {
      case SortKey.Price:
        return sorted.sort((a, b) => r * (+a.amount - +b.amount))
      case SortKey.EndTime:
        return sorted.sort((a, b) => r * (+a.end_time - +b.end_time))
      case SortKey.LootId:
        return sorted.sort((a, b) => r * (+a.token_id - +b.token_id))
    }
  }, [historicalAuctions, historicalAuctionSortBy, historicalAuctionAsc])

  const pagedHistoricalAuction = useMemo(
    () => sortedHistoricalAuction.slice(
      (historicalPage - 1) * pageSize,
      historicalPage * pageSize,
    ),
    [sortedHistoricalAuction, historicalPage],
  )

  const onSetTabValue = (value: TabValue) => {
    ls.set('tabValue', value as unknown as string)
    setValue(value)
  }

  return (
    <>
      <Box marginTop="45px" marginBottom="15px">
        <Typography variant="h1">Explore Space</Typography>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <KnowhereTabs
          value={value}
          onChange={(_e, value: TabValue) => {
            onSetTabValue(value)
          }}
        >
          <KnowhereTab value={TabValue.NFT} label="NFT" />
        </KnowhereTabs>
      </Box>
      <Box display="flex" flexDirection="column" width="100%" alignItems="center" mt={2}>
        <TabPanel value={value} index={TabValue.NFT}>
          <Box display="flex" width="100%" justifyContent="space-between">
            <Box display="flex" alignItems="flex-end" mb={1}>
              <Typography variant="h3" lineHeight="100%">
                In Progress
              </Typography>
            </Box>
            <Box display="flex">
              <StyledSelect
                value={inProgressAuctionSortBy}
                onChange={(e) => setInProgressAuctionSortBy(e.target.value as any)}
                className="hover-pointer"
              >
                <option value={SortKey.Price}>Price</option>
                <option value={SortKey.EndTime}>End Time</option>
                <option value={SortKey.LootId}>Token ID</option>
              </StyledSelect>
              <BorderedBox
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={1}
                ml={2}
                className="hover-pointer"
                onClick={() => setInProgressAuctionAsc(!inProgressAuctionAsc)}
              >
                <ArrowUpIcon flip={inProgressAuctionAsc.toString()} />
                <Typography whiteSpace="pre">{inProgressAuctionAsc ? 'ASC ' : 'DESC'}</Typography>
              </BorderedBox>
            </Box>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
            <Container maxWidth="xl" disableGutters>
              <Grid container spacing={3.5}>
                {pagedInProgressAuction.length > 0 ? (
                  pagedInProgressAuction.map((auction) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={3}
                      xl={3}
                      marginBottom={2}
                      key={auction.auction_id}
                    >
                      <RarityAuctionCard auction={auction} nft={auctionsNfts[auction?.token_id]} isInstantSale={+auction.duration === 0} />
                    </Grid>
                  ))
                ) : (
                  <EmptyState />
                )}
              </Grid>
            </Container>
            <Pagination
              page={inProgressPage}
              count={Math.ceil(auctions.length / pageSize)}
              onChange={(e, val) => setInProgressPage(val)}
            />
          </Box>
          <Divider />
          <Box display="flex" width="100%" justifyContent="space-between">
            <Box display="flex" alignItems="flex-end" mb={2}>
              <Typography variant="h3" lineHeight="100%">
                Not Started
              </Typography>
            </Box>
            <Box display="flex">
              <StyledSelect
                value={notStartedAuctionSortBy}
                onChange={(e) => setNotStartedAuctionSortBy(e.target.value as any)}
                className="hover-pointer"
              >
                <option value={SortKey.Price}>Price</option>
                <option value={SortKey.EndTime}>End Time</option>
                <option value={SortKey.LootId}>Token ID</option>
              </StyledSelect>
              <BorderedBox
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={1}
                ml={2}
                className="hover-pointer"
                onClick={() => setNotStartedAuctionAsc(!notStartedAuctionAsc)}
              >
                <ArrowUpIcon flip={notStartedAuctionAsc.toString()} />
                <Typography whiteSpace="pre">{notStartedAuctionAsc ? 'ASC ' : 'DESC'}</Typography>
              </BorderedBox>
            </Box>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
            <Container maxWidth="xl" disableGutters>
              <Grid container spacing={3.5}>
                {pagedNotStartedAuction.length > 0 ? (
                  pagedNotStartedAuction.map((auction) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={3}
                      xl={3}
                      marginBottom={2}
                      key={auction.auction_id}
                    >
                      <RarityAuctionCard auction={auction} nft={notStartedAuctionNfts[auction?.token_id]} isInstantSale={+auction.duration === 0} />
                    </Grid>
                  ))
                ) : (
                  <EmptyState />
                )}
              </Grid>
            </Container>
            <Pagination
              page={notStartedPage}
              count={Math.ceil(notStartedAuctions.length / pageSize)}
              onChange={(e, val) => setNotStartedPage(val)}
            />
          </Box>
          <Divider />
          {/* <Box display="flex" width="100%" justifyContent="space-between">
            <Box display="flex" alignItems="flex-end" mb={2}>
              <Typography variant="h3" lineHeight="100%">
                Ended Auctions
              </Typography>
              <a href="/about/lunalapin" target="_blank" style={{ marginLeft: 16 }}>
                <Typography variant="subtitle1">About rarities</Typography>
              </a>
            </Box>
            <Box display="flex">
              <StyledSelect
                value={historicalAuctionSortBy}
                onChange={(e) => setHistoricalAuctionSortBy(e.target.value as any)}
                className="hover-pointer"
              >
                <option value={SortKey.Price}>Price</option>
                <option value={SortKey.EndTime}>End Time</option>
                <option value={SortKey.LootId}>Lapin ID</option>
              </StyledSelect>
              <BorderedBox
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={1}
                ml={2}
                className="hover-pointer"
                onClick={() => _setHistoricalAuctionAsc(!notStartedAuctionAsc)}
              >
                <ArrowUpIcon flip={historicalAuctionAsc.toString()} />
                <Typography whiteSpace="pre">{historicalAuctionAsc ? 'ASC ' : 'DESC'}</Typography>
              </BorderedBox>
            </Box>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
            <Container maxWidth="xl" disableGutters>
              <Grid container spacing={3.5}>
                {pagedHistoricalAuction.length > 0 ? (
                  pagedHistoricalAuction.map((auction) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={3}
                      xl={3}
                      marginBottom={2}
                      key={auction.auction_id}
                    >
                      <RarityAuctionCard auction={auction} />
                    </Grid>
                  ))
                ) : (
                  <EmptyState />
                )}
              </Grid>
            </Container>
            <Pagination
              page={historicalPage}
              count={Math.ceil(historicalAuctions.length / pageSize)}
              onChange={(e, val) => setHistoricalPage(val)}
            />
          </Box> */}
        </TabPanel>
      </Box>
    </>
  )
}
