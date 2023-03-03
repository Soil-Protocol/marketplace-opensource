use cosmwasm_std::{
    Deps, Addr, StdResult, Uint128,  Order, QueryRequest, WasmQuery, to_binary
};
use cw_storage_plus::Bound;
use cw_utils::maybe_addr;
use cw721::{Cw721QueryMsg, OwnerOfResponse};
use marketplace::auction::{ConfigResponse, StateResponse, AuctionResponse, CalculatePriceResponse, RoyaltyFeeResponse, RoyaltyResponse, RoyaltyAdminResponse, AllRoyaltyResponse, AllRoyaltyListResponse, Royalty, Bid, BidHistoryByAuctionIdResponse,  AuctionListResponse ,BidCountResponse };

use crate::state::{ CONFIG, STATE, AUCTIONS, ROYALTIES, ROYALTY_ADMINS, 
    NFT_AUCTION_MAPS, Auction, BID_HISTORY_BY_AUCTION_ID, AUCTION_ID_BY_SELLER,
    AUCTION_ID_BY_AMOUNT, AUCTION_ID_BY_ENDTIME, BID_COUNT_BY_AUCTION_ID,
    NOT_STARTED_AUCTION, AUCTION_ID_BY_BIDDER
 };
use std::marker::PhantomData;

const DEFAULT_LIMIT: u32 = 10;
const MAX_LIMIT: u32 = 100;

pub fn query_config(
    deps: Deps,
) -> StdResult<ConfigResponse> {
    let config = CONFIG.load(deps.storage)?;
    Ok(ConfigResponse {
        owner: config.owner.to_string(),
        protocol_fee: config.protocol_fee,
        min_reserve_price: config.min_reserve_price,
        accepted_denom: config.accepted_denom,
        duration: config.duration,
        min_increment: config.min_increment,
        extension_duration: config.extension_duration,
        collector_address: config.collector_address.to_string(),
        max_royalty_fee: config.max_royalty_fee
    })
}

pub fn query_state(
    deps: Deps,
) -> StdResult<StateResponse> {
    let state = STATE.load(deps.storage)?;
    Ok(StateResponse {
        next_auction_id: state.next_auction_id,
        is_freeze: state.is_freeze
    })
}

pub fn query_nft_owner(
    deps: Deps,
    nft_contract: String,
    token_id: String
) -> StdResult<Addr> {
    let owner_response: OwnerOfResponse =
      deps.querier.query(&QueryRequest::Wasm(WasmQuery::Smart {
          contract_addr: nft_contract,
          msg: to_binary(&Cw721QueryMsg::OwnerOf {
              token_id,
              include_expired: None
          })?,
      }))?;
    Ok(deps.api.addr_validate(&owner_response.owner)?)
}

pub fn query_auction(
    deps: Deps,
    auction_id: Uint128
) -> StdResult<AuctionResponse> {
    let auction = AUCTIONS.load(deps.storage, auction_id.u128())?;
    _query_auction(auction)
}

fn _query_auction(
    auction: Auction
) -> StdResult<AuctionResponse> {
    let creator_address = match auction.creator_address {
        Some(v) => Some(v.to_string()),
        None => None
    };
    let bidder = match auction.bidder {
        Some(v) => Some(v.to_string()),
        None => None
    };
    Ok(AuctionResponse {
        auction_id: auction.auction_id,
        auction_type: auction.auction_type,
        nft_contract: auction.nft_contract.to_string(),
        token_id: auction.token_id,
        seller: auction.seller.to_string(),
        duration: auction.duration,
        extension_duration: auction.extension_duration,
        denom: auction.denom,
        reserve_price: auction.reserve_price,
        end_time: auction.end_time,
        bidder: bidder,
        amount: auction.amount,
        is_settled: auction.is_settled,
        creator_address: creator_address,
        royalty_fee: auction.royalty_fee
    })
}

pub fn query_royalty_fee(
    deps: Deps,
    contract_addr: String
) -> StdResult<RoyaltyFeeResponse> {
    let contract_addr_raw = deps.api.addr_validate(&contract_addr)?;
    let royalty = ROYALTIES.may_load(deps.storage, &contract_addr_raw)?;
    let royalty_response: Option<RoyaltyResponse> = match royalty {
        Some(royal) => Some(RoyaltyResponse {
            royalty_fee: royal.royalty_fee,
            creator: royal.creator.to_string()
        }),
        None => None
    };
    Ok(RoyaltyFeeResponse {
        royalty_fee: royalty_response
    })
}

pub fn query_nft_auction_map(
    deps: Deps,
    nft_contract: String,
    token_id: String
) -> StdResult<AuctionResponse> {
    let nft_contract_addr = deps.api.addr_validate(&nft_contract)?;
    let auction_id = NFT_AUCTION_MAPS.load(deps.storage, (&nft_contract_addr, token_id.clone()))?;
    let auction = AUCTIONS.load(deps.storage, auction_id)?;
    _query_auction(auction)
}

pub fn query_auction_by_nft(
    deps: Deps,
    nft_contract: String,
    limit: Option<u32>
) -> StdResult<Vec<u128>> {
    let nft_contract_addr = deps.api.addr_validate(&nft_contract)?;
    let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;
    let auction_ids = NFT_AUCTION_MAPS
        .prefix(&nft_contract_addr)
        .range(deps.storage, None, None, Order::Ascending)
        .take(limit)
        .map(|x| {
            let (_, auction_id) = x.unwrap();
            auction_id
        })
        .collect::<Vec<u128>>();
    return  Ok(auction_ids);
}

pub fn query_auction_by_seller(
    deps: Deps,
    seller: String,
    limit: Option<u32>
) -> StdResult<Vec<u128>> {
    let seller_addr = deps.api.addr_validate(&seller)?;
    let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;
    let auction_ids = AUCTION_ID_BY_SELLER
        .prefix(&seller_addr)
        .range(deps.storage, None, None, Order::Ascending)
        .take(limit)
        .map(|x| {
            let (auction_id, _) = x.unwrap();
            auction_id
        }).collect::<Vec<u128>>();

    return  Ok(auction_ids);
}

pub fn query_auction_by_end_time(
    deps: Deps,
    nft_contract: String,
    end_time: u64,
    limit: Option<u32>,
    is_desc: Option<bool>
)  -> StdResult<Vec<u128>> {
    let nft_addr = deps.api.addr_validate(&nft_contract)?;
    let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;
    let mut order = Order::Ascending;
    if (is_desc.unwrap_or(false)){
        order = Order::Descending;
    }
    let auction_ids = AUCTION_ID_BY_ENDTIME
        .sub_prefix(&nft_addr)
        .range(deps.storage, Some(Bound::exclusive((end_time, 0))), None, order)
        .take(limit)
        .map(|x| {
            let ((_, auction_id), _) = x.unwrap();
            auction_id
        }).collect::<Vec<u128>>();

    return  Ok(auction_ids);
}

pub fn query_not_started_auctions(
    deps: Deps,
    nft_contract: String,
    start_after: Option<u128>,
    limit: Option<u32>,
    is_desc: Option<bool>
)  -> StdResult<Vec<u128>> {
    let nft_addr = deps.api.addr_validate(&nft_contract)?;
    let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;
    let mut order = Order::Ascending;
    if (is_desc.unwrap_or(false)){
        order = Order::Descending;
    }
    let start_after =  start_after.unwrap_or(0u128);
    let auction_ids = NOT_STARTED_AUCTION
        .prefix(&nft_addr)
        .range(deps.storage, Some(Bound::exclusive((start_after))), None, order)
        .take(limit)
        .map(|x| {
            let (auction_id, _) = x.unwrap();
            auction_id
        }).collect::<Vec<u128>>();
    return Ok(auction_ids);
}

pub fn query_auction_by_bidder(
    deps: Deps,
    bidder: String,
    start_after: Option <u128>,
    limit: Option<u32>,
) -> StdResult<Vec<u128>>{
    let bidder = deps.api.addr_validate(&bidder)?;
    let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;
    let start_after =  start_after.unwrap_or(0u128);
    let auction_ids = AUCTION_ID_BY_BIDDER
        .prefix(&bidder)
        .range(deps.storage, Some(Bound::exclusive(start_after)), None, Order::Ascending)
        .take(limit)
        .map(|x| {
            let (auction_id, _) = x.unwrap();
            auction_id
        }).collect::<Vec<u128>>();
    return Ok(auction_ids);
}

pub fn query_auction_by_amount(
    deps: Deps,
    nft_contract: String,
    amount: Uint128,
    limit: Option<u32>
)  -> StdResult<Vec<u128>> {
    let nft_addr = deps.api.addr_validate(&nft_contract)?;
    let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;
    let auction_ids = AUCTION_ID_BY_AMOUNT
        .sub_prefix(&nft_addr)
        .range(deps.storage, Some(Bound::exclusive((amount.u128(), 0))), None, Order::Ascending)
        .take(limit)
        .map(|x| {
            let ((_, auction_id), _) = x.unwrap();
            auction_id
        }).collect::<Vec<u128>>();

    return  Ok(auction_ids);
}

pub fn query_calculate_price(
    deps: Deps,
    nft_contract: String,
    token_id: String,
    amount: Uint128
) -> StdResult<CalculatePriceResponse> {
    let config = CONFIG.load(deps.storage)?;
    let nft_contract_addr = deps.api.addr_validate(&nft_contract)?;
    let royalty = ROYALTIES.may_load(deps.storage, &nft_contract_addr)?;
    let royalty_amount = match royalty {
        Some(royal) => royal.royalty_fee * amount,
        None => Uint128::zero()
    };
    let protocol_amount = config.protocol_fee * amount;
    let seller_amount = amount - (protocol_amount + royalty_amount);
    Ok(CalculatePriceResponse {
        nft_contract,
        token_id,
        amount,
        seller_amount,
        protocol_fee: protocol_amount,
        royalty_fee: royalty_amount
    })
}


pub fn query_bid_history_by_auction_id(
    deps: Deps,
    auction_id: Uint128,
    limit: Option<u32>
) -> StdResult<BidHistoryByAuctionIdResponse> {
    let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;
    let bid_history = BID_HISTORY_BY_AUCTION_ID
        .prefix(auction_id.u128())
        .range(deps.storage, None, None, Order::Ascending)
        .take(limit)
        .map(|x| {
            let (_, bid) = x.unwrap(); 
            bid
        })
        .collect::<Vec<Bid>>();
    Ok(BidHistoryByAuctionIdResponse{ bids: bid_history })
}

pub fn query_bid_number(
    deps: Deps,
    auction_id: Uint128,
) -> StdResult<BidCountResponse> {
    let count = BID_COUNT_BY_AUCTION_ID.load(deps.storage, auction_id.u128())?;
    Ok(BidCountResponse{ count: count })
}


pub fn query_all_royalty(
    deps: Deps,
    start_after: Option<String>,
    limit: Option<u32>
) -> StdResult<AllRoyaltyListResponse> {
    let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;
    let start_addr = maybe_addr(deps.api, start_after)?;
    let start = start_addr.as_ref().map(Bound::exclusive);

    let royaltys: StdResult<Vec<_>> = ROYALTIES
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .map(parse_royalty)
        .collect();
    Ok(AllRoyaltyListResponse { royalty_fees: royaltys? })
}

pub fn query_royalty_admin(
    deps: Deps,
    address: String
) -> StdResult<RoyaltyAdminResponse> {
    let address_raw = deps.api.addr_validate(&address)?;
    let admin = ROYALTY_ADMINS.may_load(deps.storage, &address_raw)?;

    let enable = match admin {
        Some(v) => v,
        None => false
    };

    Ok(RoyaltyAdminResponse {
        address: address,
        enable: enable
    })
}

pub fn construct_action_response(
    deps: Deps,
    auction_ids: Vec<u128>
) -> StdResult<AuctionListResponse> {
    let mut auctions: Vec<AuctionResponse> = vec![];
    for i in 0..auction_ids.len() {
        let res = auction_ids.get(i).unwrap();
        let auction_id = *res;
        let res = query_auction(deps, Uint128::from(auction_id));
        match res {
            Ok(a) => auctions.push(a),
            Err(_) => ()
        };
    }
    Ok(AuctionListResponse {
        auctions: auctions
    })
}

fn parse_royalty(item: StdResult<(Addr,Royalty)>) -> StdResult<AllRoyaltyResponse> {
    item.map(|(nft_address, royalty)| AllRoyaltyResponse {
        contract_addr: nft_address.to_string(),
        royalty_fee: royalty.royalty_fee,
        creator: royalty.creator.to_string()
    })
}
