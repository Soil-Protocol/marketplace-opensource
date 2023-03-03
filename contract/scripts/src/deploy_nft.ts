import {create_wallet, init, query, upload, transfer, execute, migrate, batchExecute} from './util'

require('dotenv').config()
const { MNEMONIC, MNEMONIC2 } = process.env

const wallet = create_wallet(MNEMONIC);
const wallet2 = create_wallet(MNEMONIC2);

(async() => {
    // upload code
    try{
      // const code_path = '../wasm/cw721_metadata_onchain.wasm'
      // const code_id = await upload(wallet, code_path)
      // console.log(code_id)
      // initialize contract
      // const response = await init(wallet, '7926', {
      //   name: 'Luna Lapin',
      //   symbol: 'LAPIN',
      //   minter: wallet.key.accAddress,
      // }, 'nft')
      // const nft_address = response.contract_addr
      // console.log(`nft address: ${nft_address}`)
      // // get minter info
      // const minter:any = await query(nft_address, {
      //   minter: {}
      // })
      // console.log(`minter: ${minter.minter}`)
      // mint nft
      const nft_address = 'terra126g6mxz77s5jeplhgzygmns4wnad85kn6qq99f62cp230499cknsnkzsmd'
      let mintMSGs = [
        {
          mint: {
            token_id: '0',
            owner: wallet.key.accAddress,
            token_uri: "ipfs://QmboqXNQcf4pcNhfMWAeXCbTejxuVreDVDaB4qoFmg7DBR",
            extension: {
              image: "ipfs://QmboqXNQcf4pcNhfMWAeXCbTejxuVreDVDaB4qoFmg7DBR",
              description: '',
              name: `LunaLapin #0`,
              attributes: [
                {
                  trait_type: "background",
                  value: "aurora"
                },
                {
                  trait_type: "head",
                  value: "cosmic"
                }
              ]
            }
          }
        },
        {
          mint: {
            token_id: '1',
            owner: wallet.key.accAddress,
            token_uri: "ipfs://QmboqXNQcf4pcNhfMWAeXCbTejxuVreDVDaB4qoFmg7DBR",
            extension: {
              image: "ipfs://QmboqXNQcf4pcNhfMWAeXCbTejxuVreDVDaB4qoFmg7DBR",
              description: '',
              name: `LunaLapin #1`,
              attributes: [
                {
                  trait_type: "background",
                  value: "aurora"
                },
                {
                  trait_type: "head",
                  value: "cosmic"
                }
              ]
            }
          }
        },
        {
          mint: {
            token_id: '2',
            owner: wallet.key.accAddress,
            token_uri: "ipfs://QmboqXNQcf4pcNhfMWAeXCbTejxuVreDVDaB4qoFmg7DBR",
            extension: {
              image: "ipfs://QmboqXNQcf4pcNhfMWAeXCbTejxuVreDVDaB4qoFmg7DBR",
              description: '',
              name: `LunaLapin #2`,
              attributes: [
                {
                  trait_type: "background",
                  value: "aurora"
                },
                {
                  trait_type: "head",
                  value: "cosmic"
                }
              ]
            }
          }
        }
      ]
      await batchExecute(wallet, nft_address, mintMSGs)
      // get nft info
      // const nft_info = await query(nft_address, {
      //   nft_info: {
      //     token_id: '0'
      //   }
      // })
      // console.log(nft_info)
      
      // check royalty
      // const check_royalty = await query(nft_address, {
      //   check_royalties: {}
      // })
      // console.log(check_royalty)
      // set royalty
      // get nft info
      // const nft_info2 = await query(nft_address, {
      //   nft_info: {
      //     token_id: '1'
      //   }
      // })
      // console.log(nft_info2)


      // get nft info
      // const nft_info3 = await query(nft_address, {
      //   nft_info: {
      //     token_id: '2'
      //   }
      // })
      // console.log(nft_info3)
    }catch(err){
      console.log('err ', err)
    }
    // // check royalty
    // const check_royalty2 = await query(nft_address, {
    //   check_royalties: {}
    // })
    // console.log(check_royalty2)
    // const royalty_token1 = await query(nft_address, {
    //   royalty_info: {
    //     token_id: '1',
    //     sale_price: '1000000'
    //   }
    // })
    // console.log(royalty_token1)
    // // burn token
    // await execute(wallet2, nft_address, {
    //   burn: {
    //     token_id: '1'
    //   }
    // })
})()