import {create_wallet, init, query, upload, transfer, execute, migrate} from './util'

require('dotenv').config()
const { MNEMONIC, AUCTION_MAINNET_CODE_ID } = process.env

const wallet = create_wallet(MNEMONIC);


(async() => {
    // Initialize Marketplace Contract
    try{
      const result = await init(wallet, AUCTION_MAINNET_CODE_ID, {
          protocol_fee: '0.02', // Protocol Fee to 2 Percent
          min_increment: "0.1", // Minimum Bid to 10% above the price
          duration: 86400, //  Duration of the auction to one day (denominated in second)
          extension_duration: 300, // Extension duration for bidding 5 minute (denominated in seconds)
          accepted_denom: ['uluna','ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4','ibc/CBF67A2BCF6CAE343FDF251E510C8E18C361FC02B23430C121116E0811835DEF'],
          min_reserve_price: '1000', // Minimum Price is 1 Luna
          max_royalty_fee: '0.2', // Maximum Royalty Fee is 20%
          collector_address: 'terra1endu7640tu3jf72qxsyd82fxapsyulv8zxqluk' // Royalty Receiving Fee 
        },'kw-marketplace')
      const auction_addr = result.contract_addr
      console.log('auction address is ',auction_addr)
      const state = await query(auction_addr, {
        state: {}
      })
      console.log(state)
    }catch(err){
      console.log('err ', err)
    }
})()
