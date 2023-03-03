import {create_wallet, init, query, upload, transfer, execute, migrate, delay, balance} from './util'

require('dotenv').config()
const { MNEMONIC, AUCTION_ADDR ,NFT_ADDR } = process.env

const wallet = create_wallet(MNEMONIC);

(async() => {
    try{
      const result = await execute(wallet, AUCTION_ADDR, {
        set_royalty_fee: {
          contract_addr: NFT_ADDR,
          royalty_fee: '200',
          creator: 'terra1y4747xzrmtdq04a20zuernnrduvt65qlctkzar'
        }
      })
      console.log('result ', result)
    }catch(err){
      console.log('err ', err)
    }
    // await execute(wallet, token_addr, {
    //   transfer_nft: {
    //     recipient: 'terra1em2sanwzpv5226dxlp3rwf765r7x5gvrqfdk7p',
    //     token_id: '0'
    //   }
    // })
})()
