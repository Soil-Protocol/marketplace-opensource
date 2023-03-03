import {create_wallet, init, query, upload, transfer, execute, migrate, delay, balance} from './util'

require('dotenv').config()
const { MNEMONIC, AUCTION_ADDR } = process.env

const wallet = create_wallet(MNEMONIC);

(async() => {
    try{
      // add royalty permission to deployer account
      const result = await execute(wallet, AUCTION_ADDR, {
        set_royalty_admin: {
          address: wallet.key.accAddress,
          enable: true
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
