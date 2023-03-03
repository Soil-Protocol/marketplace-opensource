import {create_wallet, init, query, upload, transfer, execute, migrate} from './util'

require('dotenv').config()
const { MNEMONIC, AUCTION_ADDR } = process.env


const wallet = create_wallet(MNEMONIC);

(async() => {
  try{
    const result = await execute(wallet, AUCTION_ADDR, {
      admin_cancel_auction: {
          auction_id: "12"
      }
    })
    console.log('result ', result)
  }catch(err){
    console.log('err ', err)
  }
})()

