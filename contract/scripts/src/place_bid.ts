import {create_wallet, init, query, upload, transfer, execute, migrate} from './util'

require('dotenv').config()
const { MNEMONIC, AUCTION_ADDR } = process.env

const wallet = create_wallet(MNEMONIC);

(async() => {
    try{
      await execute(wallet, AUCTION_ADDR, {
        place_bid: {
          auction_id: '1'
        }
      }, '1000000ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4')
      await execute(wallet, AUCTION_ADDR, {
        settle: {
          auction_id: '1'
        }
      })
    }catch(err){
      console.log('err ', err)
    }
    // await execute(wallet, auction_addr, {
    //   admin_cancel_auction: {
    //     auction_id: '2'
    //   }
    // })
})()
