use cosmwasm_std::{Uint128, Addr, Decimal};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cw721::{Cw721ReceiveMsg};
use std::fmt;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub protocol_fee: Decimal,
    pub min_increment: Decimal,
    pub min_reserve_price: Uint128,
    pub max_royalty_fee: Decimal,
    pub duration: u64,
    pub extension_duration: u64,
    pub accepted_denom: Vec<String>,
    pub collector_address: String
}

/// This is like Cw721HandleMsg but we add a Mint command for an owner
/// to make this stand-alone. You will likely want to remove mint and
/// use other control logic in any contract that inherits this.
#[derive(Serialize, Deserialize, Clone, PartialEq, JsonSchema, Debug)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    ReceiveNft(Cw721ReceiveMsg),
    CancelAuction {
        auction_id: Uint128
    },
    PlaceBid {
        auction_id: Uint128
    },
    Settle {
        auction_id: Uint128
    },
    // admin
    AdminChangeConfig {
        protocol_fee: Decimal,
        min_increment: Decimal,
        min_reserve_price: Uint128,
        max_royalty_fee: Decimal,
        duration: u64,
        extension_duration: u64,
        accepted_denom: Vec<String>,
        collector_address: String
    },
    AdminCancelAuction {
        auction_id: Uint128
    },
    SetRoyaltyFee{
        contract_addr: String,
        creator: String,
        royalty_fee: Decimal,
    },
    SetRoyaltyAdmin {
        address: String,
        enable: bool
    },
    // stop create new auction
    AdminPause {},
    AdminResume {},
    SettleHook {
        nft_contract: String,
        token_id: String,
        owner: String
    }
}

/// This is like Cw721HandleMsg but we add a Mint command for an owner
/// to make this stand-alone. You will likely want to remove mint and
/// use other control logic in any contract that inherits this.
#[derive(Serialize, Deserialize, Clone, PartialEq, JsonSchema, Debug)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    Config {},
    State {},
    Auction {
        auction_id: Uint128
    },
    RoyaltyFee {
        contract_addr: String
    },
    RoyaltyAdmin {
        address: String
    },
    AllRoyaltyFee {
        start_after: Option<String>,
        limit: Option<u32>,
    },
    CalculatePrice {
        nft_contract: String,
        token_id: String,
        amount: Uint128
    },
    NftAuction {
        nft_contract: String,
        token_id: String
    },
    BidHistoryByAuctionId {
        auction_id: Uint128,
        limit: Option<u32>
    },
    BidsCount {
        auction_id: Uint128
    },
    AuctionByContract{
        nft_contract: String,
        limit: Option<u32>
    },
    AuctionBySeller {
        seller: String,
        limit: Option<u32>
    },
    AuctionByAmount{
        nft_contract: String,
        amount: Uint128,
        limit: Option<u32>
    }, 
    AuctionByEndTime{
        nft_contract: String,
        end_time: u64,
        limit: Option<u32>,
        is_desc: Option<bool>
    },
    NotStartedAuction{
        nft_contract: String,
        start_after: Option<u128>,
        limit: Option<u32>,
        is_desc: Option<bool>
    },
    AuctionByBidder{
        bidder: String,
        start_after: Option<u128>,
        limit: Option<u32>,
    }
}


#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Royalty {
    pub royalty_fee: Decimal,
    pub creator: Addr
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct RoyaltyResponse {
    pub royalty_fee: Decimal,
    pub creator: String
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct RoyaltyAdminResponse {
    pub address: String,
    pub enable: bool
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct RoyaltyFeeResponse {
    pub royalty_fee: Option<RoyaltyResponse>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct AllRoyaltyResponse {
    pub contract_addr: String,
    pub royalty_fee: Decimal,
    pub creator: String
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct AllRoyaltyListResponse {
    pub royalty_fees: Vec<AllRoyaltyResponse>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct BidHistoryByAuctionIdResponse {
    pub bids: Vec<Bid>
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ConfigResponse {
    pub owner: String,
    pub protocol_fee: Decimal,
    pub min_reserve_price: Uint128,
    pub min_increment: Decimal,
    pub duration: u64,
    pub extension_duration: u64,
    pub accepted_denom: Vec<String>,
    pub collector_address: String,
    pub max_royalty_fee: Decimal
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct StateResponse {
    pub next_auction_id: Uint128,
    pub is_freeze: bool
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct AuctionListResponse {
    pub auctions: Vec<AuctionResponse>
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct BidCountResponse {
    pub count: Uint128
}


#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct AuctionResponse {
    pub auction_id: Uint128,
    pub auction_type: AuctionType,
    pub nft_contract: String,
    pub token_id: String,
    pub seller: String,
    pub duration: u64,
    pub extension_duration: u64,
    pub denom: String,
    pub reserve_price: Uint128,
    pub end_time: u64,
    pub bidder: Option<String>,
    pub amount: Uint128,
    pub creator_address: Option<String>,
    pub royalty_fee: Decimal,
    pub is_settled: bool
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct CalculatePriceResponse {
    pub nft_contract: String,
    pub token_id: String,
    pub amount: Uint128,
    pub protocol_fee: Uint128,
    pub royalty_fee: Uint128,
    pub seller_amount: Uint128
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Bid {
    pub auction_id: Uint128,
    pub bidder: Addr,
    pub time: u64,
    pub denom: String,
    pub amount: Uint128
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum AuctionType {
    Auction,
    BuyNow
}

impl fmt::Display for AuctionType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AuctionType::Auction => write!(f, "auction"),
            AuctionType::BuyNow => write!(f, "buy_now"),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, PartialEq, JsonSchema, Debug)]
#[serde(rename_all = "snake_case")]
pub enum Cw721HookMsg {
    CreateAuction {
        denom: String,
        reserve_price: Uint128,
        is_instant_sale: bool // default is false
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct MigrateMsg {}