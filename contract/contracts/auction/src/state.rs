use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{ Uint128, Addr, Decimal };
use cw_storage_plus::{ Item, Map };
use marketplace::auction::{ Royalty, AuctionType, Bid };

pub const STATE_KEY: &[u8] = b"state";

pub const AUCTION_PREFIX: &[u8] = b"auctions";
pub const ROYALTY_FEE_PREFIX: &[u8] = b"royalty_fee_prefix";

pub const ROYALTY_ADMIN_PREFIX: &[u8] = b"royalty_admin_prefix";

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub owner: Addr,
    pub protocol_fee: Decimal,
    pub min_reserve_price: Uint128,
    pub min_increment: Decimal,
    pub max_royalty_fee: Decimal,
    pub duration: u64,
    pub extension_duration: u64,
    pub accepted_denom: Vec<String>,
    pub collector_address: Addr
}


#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub next_auction_id: Uint128,
    pub is_freeze: bool, // if freeze, no new auction and first bid
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Auction {
    pub auction_id: Uint128,
    pub nft_contract: Addr,
    pub token_id: String,
    pub auction_type: AuctionType,
    pub seller: Addr,
    pub duration: u64,
    pub extension_duration: u64,
    pub denom: String,
    pub reserve_price: Uint128,
    pub end_time: u64,
    pub bidder: Option<Addr>,
    pub amount: Uint128,
    pub creator_address: Option<Addr>,
    pub royalty_fee: Decimal,
    pub protocol_fee: Decimal,
    pub is_settled: bool
}



pub const CONFIG: Item<Config> = Item::new("config");
pub const STATE: Item<State> = Item::new("state");
pub const AUCTIONS: Map<u128, Auction> = Map::new("dealers");
pub const ROYALTIES: Map<&Addr, Royalty> = Map::new("royaltys");
pub const ROYALTY_ADMINS: Map<&Addr, bool> = Map::new("royalty_admins");
// Key Address -> Bids Id -> Bids
pub const BID_HISTORY_BY_AUCTION_ID: Map<(u128, u128), Bid> = Map::new("bid_history_by_auction_id");
pub const AUCTION_ID_BY_SELLER: Map<(&Addr, u128), bool> = Map::new("auction_id_by_seller");
pub const AUCTION_ID_BY_ENDTIME: Map<(&Addr, u64, u128), bool> = Map::new("auction_id_by_end_time");
pub const AUCTION_ID_BY_AMOUNT: Map<(&Addr, u128, u128), bool> = Map::new("auction_id_by_amount");
pub const AUCTION_ID_BY_BIDDER: Map<(&Addr, u128), bool> = Map::new("auction_id_by_bidder");
pub const NOT_STARTED_AUCTION: Map<(&Addr, u128), bool> = Map::new("not_started_auction");
pub const BID_COUNT_BY_AUCTION_ID: Map<u128, Uint128> = Map::new("bid_count_by_auction_id");
pub const NFT_AUCTION_MAPS: Map<(&Addr, String), u128> = Map::new("nft_auction_maps");