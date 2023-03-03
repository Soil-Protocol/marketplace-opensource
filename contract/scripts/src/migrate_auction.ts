import {create_wallet, init, query, upload, transfer, execute, migrate} from './util'

require('dotenv').config()
const { MNEMONIC, AUCTION_ADDR } = process.env

const wallet = create_wallet(MEMONIC);

(async() => {
    // upload code
    try{
        const auction_code_path = '../artifacts/auction.wasm'
        const auction_code_id = await upload(wallet, auction_code_path)
        console.log('upload code complete code id :',auction_code_id)
        const migrate_response = await migrate(wallet, AUCTION_ADDR, auction_code_id, {})
        console.log(migrate_response)
    }catch(err){
        console.log('err ', err)
    }

})()
