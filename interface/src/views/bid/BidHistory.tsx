import { Box, Typography, Pagination } from '@mui/material'
import { useConnectedWallet } from '@terra-money/wallet-provider'
import { HistoricalBid } from 'interfaces/auction.interface'
import { maskAddress } from 'utils/address.util'
import { formatAmount, parseAmount } from 'utils/number.util'
import { denomToSymbol } from 'utils/currency.util'
import dayjs from 'dayjs'

export const BidHistory = ({ bids, connectedWallet } : { bids: HistoricalBid[], connectedWallet: any }) => (
  <Box>
    <Box
      className="nes-container is-rounded is-dark"
      style={{
        background: 'transparent',
        margin: 0,
      }}
    >
      <Typography variant="body2">Bid History</Typography>
      <Box
        style={{
          border: '2px solid #fff',
          width: 'calc(100% + 24px + 24px)',
          margin: '10px 0 20px -24px',
        }}
      />
      {bids.length == 0 ? (
        <Typography variant="overline" style={{ color: 'rgb(109 109 109)' }}>
          No Bidding.
        </Typography>
      ) : (
        <Box display="flex" flexDirection="column">
          <Box display="flex" width="100%">
            <Box flex="1.5">
              <Typography variant="body1">Bidder</Typography>
            </Box>
            <Box flex="1.5">
              <Typography variant="body1">Time</Typography>
            </Box>
            <Box flex="1" textAlign="right">
              <Typography variant="body1">Price</Typography>
            </Box>
          </Box>
          {bids.map((d) => (
            <Box display="flex" width="100%" marginTop="13px" key={d.time}>
              <Box flex="1.5">
                <Typography variant="caption">
                  {
                    connectedWallet && d.bidder === connectedWallet.walletAddress ? 'You' : maskAddress(d.bidder)
                  }
                </Typography>
              </Box>
              <Box flex="1.5">
                <Typography
                  variant="caption"
                  title={dayjs.unix(parseInt(d.time)).toString()}
                >
                  {dayjs.unix(parseInt(d.time)).fromNow()}
                </Typography>
              </Box>
              <Box flex="1" textAlign="right">
                <Typography variant="caption">{formatAmount(parseAmount(d.amount))}</Typography>
                {
                  d.denom == 'uluna'
                  ? <img
                    src="/static/icons/luna.png"
                    style={{
                      width: 16,
                      height: 16,
                      marginLeft: 8,
                    }}
                  />
                  : <Typography variant="caption"> {denomToSymbol(d.denom)}</Typography>
                }
              </Box>
            </Box>
          ))}
        </Box>
      )}
      {/* <Box display="flex" justifyContent="space-around" marginTop="15px">
        <Pagination count={10} />
      </Box> */}
    </Box>
  </Box>
)
