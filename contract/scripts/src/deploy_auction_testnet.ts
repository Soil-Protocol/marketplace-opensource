import {
  create_wallet,
  init,
  query,
  upload,
  transfer,
  execute,
  migrate,
} from "./util";

require("dotenv").config();
const { MNEMONIC, AUCTION_TESTNET_CODE_ID } = process.env;

const wallet = create_wallet(MNEMONIC);

(async () => {
  // deploy auction
  try{
    const response = await init(wallet, AUCTION_TESTNET_CODE_ID, {
      protocol_fee: "0.01",
      min_increment: "0.1",
      duration: 300,
      extension_duration: 60,
      accepted_denom: ["uluna"],
      min_reserve_price: "1000",
      max_royalty_fee: "0.2",
    collector_address: wallet.key.accAddress,
    }, 'kw-os');
    const auction_addr = response.contract_addr;
    console.log(auction_addr);
    const state = await query(auction_addr, {
      state: {},
    });
    console.log(state);
  }catch(err){
    console.log('err ', err)
  }
})();
