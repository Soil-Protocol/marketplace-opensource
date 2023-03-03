use cosmwasm_std::{CanonicalAddr, Uint128, Response, DepsMut, Deps, Env, Querier, Addr,
    StdResult, Storage,  StdError, Decimal, CosmosMsg, WasmMsg, to_binary, QueryRequest, WasmQuery, MessageInfo};
use terraswap::asset::{Asset, AssetInfo};
use marketplace::auction::{AuctionType, Bid ,Royalty, ExecuteMsg};
use cw721::{Cw721ExecuteMsg};

use crate::error::ContractError;
use crate::state::{CONFIG, STATE, ROYALTIES, AUCTIONS, BID_HISTORY_BY_AUCTION_ID, AUCTION_ID_BY_SELLER,
    BID_COUNT_BY_AUCTION_ID ,ROYALTY_ADMINS, Auction, NFT_AUCTION_MAPS, AUCTION_ID_BY_ENDTIME, 
    AUCTION_ID_BY_AMOUNT, NOT_STARTED_AUCTION, AUCTION_ID_BY_BIDDER};
use crate::querier::{query_nft_owner};

pub fn create_auction(
    deps: DepsMut,
    _env: Env,
    nft_contract: Addr,
    token_id: String,
    seller: Addr,
    denom: String,
    reserve_price: Uint128,
    is_instant_sale: bool
) -> Result<Response, ContractError> {
    // check condition
    let config = CONFIG.load(deps.storage)?;
    let mut state = STATE.load(deps.storage)?;
    // check is freeze
    if state.is_freeze {
        return Err(ContractError::AuctionFreeze {});
    }
    // check accept currency
    if !config.accepted_denom.contains(&denom) {
        return Err(ContractError::UnsupportedAsset {});
    }
    // check min reserve price
    if reserve_price < config.min_reserve_price {
        return Err(ContractError::InvalidAmount("reserve price too low".to_string()));
    }
    // check additional nft auction mapping
    match NFT_AUCTION_MAPS.may_load(deps.storage, (&nft_contract, token_id.clone()))? {
        Some(_) => return Err(ContractError::InvalidAuction("auction is duplicated".to_string())),
        None => {}
    };
    // check support royalty
    let mut creator_address: Option<Addr> = None;
    let royalty_fee_response = ROYALTIES.may_load(deps.storage, &nft_contract)?;
    let royalty_fee:Decimal = match royalty_fee_response {
        Some(v) => {
            creator_address = Some(v.creator);
            v.royalty_fee
        }
        None => Decimal::zero()
    };
    // create auction
    let auction_id = state.next_auction_id;
    let duration;
    let auction_type;
    if is_instant_sale{
        duration = 0;
        auction_type = AuctionType::BuyNow;
    } else {
        duration = config.duration;
        auction_type = AuctionType::Auction;
    }

    let auction = Auction {
        auction_id: auction_id.clone(),
        nft_contract: nft_contract.clone(),
        token_id: token_id.clone(),
        seller: seller.clone(),
        duration: duration,
        extension_duration: config.extension_duration,
        denom: denom.clone(),
        reserve_price: reserve_price,
        end_time: 0,
        auction_type: auction_type.clone(),
        bidder: None,
        amount: reserve_price,
        creator_address: creator_address,
        royalty_fee: royalty_fee,
        protocol_fee: config.protocol_fee.clone(),
        is_settled: false
    };
    // save auction
    AUCTIONS.save(deps.storage, auction_id.clone().u128(), &auction)?;
    state.next_auction_id += Uint128::from(1u128);
    STATE.save(deps.storage, &state)?;
    // save auction map
    NFT_AUCTION_MAPS.save(deps.storage, (&nft_contract, token_id.clone()), &auction_id.u128())?;
    //updating auction indices
    AUCTION_ID_BY_SELLER.save(deps.storage, (&seller, auction_id.u128()), &true)?;
    NOT_STARTED_AUCTION.save(deps.storage, (&nft_contract, auction.auction_id.u128()), &true)?;
    Ok(Response::new()        
        .add_attribute("action", "create_auction")
        .add_attribute("auction_id", auction_id)
        .add_attribute("auction_type", format!("{}", auction_type))
        .add_attribute("nft_contract", nft_contract.to_string())
        .add_attribute("token_id", token_id)
        .add_attribute("seller", seller.to_string())
        .add_attribute("denom", denom)
        .add_attribute("reserve", reserve_price)
    )
}


pub fn set_royalty_fee(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    contract_addr: String,
    creator: String,
    royalty_fee: Decimal,
) -> Result<Response, ContractError> {
    only_royalty_admin(deps.as_ref(), &env, info)?;
    let nft_contract_addr = deps.api.addr_validate(&contract_addr)?;
    let creator_addr = deps.api.addr_validate(&creator)?;
    let royalty = Royalty {
        royalty_fee: royalty_fee,
        creator: creator_addr,
    };
    ROYALTIES.save(deps.storage, &nft_contract_addr, &royalty)?;
    Ok(Response::new()
        .add_attribute("action", "set_royalty_fee")
        .add_attribute("nft_contract", contract_addr)
        .add_attribute("creator", creator)
        .add_attribute("royalty_fee", royalty_fee.to_string()))
}

pub fn set_royalty_admin(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    address: String,
    enable: bool,
) -> Result<Response, ContractError> {
    only_owner(deps.as_ref(), &env, info)?;
    
    let address_raw = deps.api.addr_validate(&address)?;
    if enable {
        ROYALTY_ADMINS.save(deps.storage, &address_raw, &true)?;
    } else {
        ROYALTY_ADMINS.remove(deps.storage, &address_raw);
    }
    
    Ok(Response::new()        
        .add_attribute("action", "set_royalty_admin")
        .add_attribute("address", address)
        .add_attribute("enable", enable.to_string()))
}

pub fn cancel_auction(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    auction_id: Uint128
) -> Result<Response, ContractError> {
    // check auction owner
    check_auction_owner(deps.as_ref(), &env, info, auction_id)?;
    // cancel auction
    let mut messages: Vec<CosmosMsg> = vec![];
    let auction = AUCTIONS.load(deps.storage, auction_id.u128())?;
    match auction.auction_type {
        AuctionType::BuyNow => {
            messages.extend(_cancel_auction(deps, env.clone(), auction_id)?);
            messages.push(CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: env.contract.address.to_string(),
                msg: to_binary(&ExecuteMsg::SettleHook {
                    nft_contract: auction.nft_contract.to_string(),
                    token_id: auction.token_id.clone(),
                    owner: auction.seller.to_string()
                })?,
                funds: vec![]
            }));
        },
        AuctionType::Auction => {
            messages.extend(_cancel_auction(deps, env.clone(), auction_id)?);
            messages.push(CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: env.contract.address.to_string(),
                msg: to_binary(&ExecuteMsg::SettleHook {
                    nft_contract: auction.nft_contract.to_string(),
                    token_id: auction.token_id.clone(),
                    owner: auction.seller.to_string()
                })?,
                funds: vec![]
            }));
        }
    }
    Ok(Response::new()
        .add_messages(messages)
        .add_attribute("action", "cancel_auction")
        .add_attribute("auction_id", auction_id)
    )
}

pub fn place_bid(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    auction_id: Uint128
) -> Result<Response, ContractError> {
    // retrieve config
    let config = CONFIG.load(deps.storage)?;
    let state = STATE.load(deps.storage)?;

    if state.is_freeze {
        return Err(ContractError::AuctionFreeze {});
    }
    if info.funds.len() > 1 {
        return Err(ContractError::InvalidAmount("sent fund in multiple denom".to_string()));
    }
    // retrieve auction
    let mut auction = AUCTIONS.load(deps.storage, auction_id.u128())?;
    if auction.is_settled {
        return Err(ContractError::InvalidAuction("already settled".to_string()));
    }
    // call place bid
    let bid_amount: Uint128 = info.funds
        .iter()
        .find(|c| c.denom == auction.denom)
        .map(|c| Uint128::from(c.amount))
        .unwrap_or_else(|| Uint128::zero());
    //check time 
    let block_time = env.block.time.seconds();
    let mut messages: Vec<CosmosMsg> = vec![];

    let bidder;

    let bid_history: Bid  = Bid{
        auction_id: auction.auction_id,
        bidder: info.sender.clone(),
        time: env.block.time.seconds(),
        denom: auction.denom.clone(),
        amount: bid_amount
    };

    match auction.auction_type {
        AuctionType::BuyNow => {
            if auction.end_time > 0 {
                return Err(ContractError::InvalidAuction("already place bid".to_string()));
            }
            if bid_amount != auction.amount {
                return Err(ContractError::InvalidAmount("bid amount is less than reserve price".to_string()));
            }
            auction.bidder = Some(info.sender.clone());
            auction.end_time = env.block.time.seconds();
        },
        AuctionType::Auction => {
            // check end time
            if auction.end_time == 0 {
                // first bid - precondition
                // check that fund is in accepted denom and greater than reserve price
                if bid_amount < auction.reserve_price {
                    return Err(ContractError::InvalidAmount("bid amount is less than reserve price".to_string()));
                }
                // first bid - action
                let end_time = block_time + auction.duration;
                auction.amount = bid_amount;
                bidder = info.sender.clone();
                auction.bidder = Some(bidder.clone());
                auction.end_time = end_time;
                //update bid information
                BID_COUNT_BY_AUCTION_ID.save(deps.storage, auction.auction_id.u128(), &Uint128::from(1u128))?;
                BID_HISTORY_BY_AUCTION_ID.save(deps.storage, (auction.auction_id.u128(), 1), &bid_history)?;
                //updating indexing storage
                AUCTION_ID_BY_ENDTIME.save(deps.storage, (&auction.nft_contract, auction.end_time, auction.auction_id.u128()), &true )?;

                AUCTION_ID_BY_AMOUNT.save(deps.storage, (&auction.nft_contract, auction.amount.u128(), auction.auction_id.u128()), &true)?;
                AUCTION_ID_BY_BIDDER.save(deps.storage, (&bidder, auction.auction_id.u128()), &true)?;
                // add bidder
            } else {
                // precondition
                bidder = info.sender.clone();
                let last_bidder;
                if block_time > auction.end_time {
                    return Err(ContractError::InvalidAuction("auction is over".to_string()));
                };
                match auction.bidder {
                    Some(v) => {
                        last_bidder = v.clone();
                        if last_bidder == bidder {
                            return Err(ContractError::InvalidAuction("you already outbid".to_string()));
                        }
                    },
                    None => return Err(ContractError::InvalidAuction("unknown bidder".to_string()))
                };
                
                let min_bid_amount = calculate_min_bid_amount(config.min_increment.clone(), auction.amount.clone())?;
                if bid_amount < min_bid_amount {
                    return Err(ContractError::InvalidAmount("bid amount too low".to_string()));
                }
                // action
                let last_amount = auction.amount;
                let last_endtime = auction.end_time;
                auction.bidder = Some(bidder.clone());
                auction.amount = bid_amount;
                
                // extension period
                if block_time + auction.extension_duration >= auction.end_time {
                    let end_time = block_time + auction.extension_duration;
                    auction.end_time = end_time;
                }

                // add to bid history
                let bid_count = BID_COUNT_BY_AUCTION_ID.load(deps.storage ,auction.auction_id.u128())? + Uint128::from(1u128);
                BID_COUNT_BY_AUCTION_ID.save(deps.storage, auction.auction_id.u128(), &Uint128::from(1u128))?;
                BID_HISTORY_BY_AUCTION_ID.save(deps.storage, (auction.auction_id.u128(), bid_count.u128()), &bid_history)?;
                //remove old endtime and add new
                AUCTION_ID_BY_ENDTIME.remove(deps.storage, (&auction.nft_contract, last_endtime, auction.auction_id.u128()));
                AUCTION_ID_BY_ENDTIME.save(deps.storage, (&auction.nft_contract, auction.end_time, auction.auction_id.u128()), &true)?;

                AUCTION_ID_BY_AMOUNT.remove(deps.storage, (&auction.nft_contract, last_amount.u128(), auction.auction_id.u128()));
                AUCTION_ID_BY_AMOUNT.save(deps.storage, (&auction.nft_contract, auction.amount.u128(), auction.auction_id.u128()), &true)?;

                AUCTION_ID_BY_BIDDER.remove(deps.storage, (&last_bidder, auction.auction_id.u128()));
                AUCTION_ID_BY_BIDDER.save(deps.storage, (&bidder.clone(), auction.auction_id.u128()), &true)?;

                let refund_asset:Asset = Asset {
                    info: AssetInfo::NativeToken {
                        denom: auction.denom.clone()
                    },
                    amount: last_amount
                };
                messages.push(refund_asset.into_msg(last_bidder)?);
            }
        }
    }
    
    // update auction
    NOT_STARTED_AUCTION.remove(deps.storage , (&auction.nft_contract, auction.auction_id.u128()));
    AUCTIONS.save(deps.storage, auction_id.u128(), &auction)?;
    
    // send fund back
    Ok(Response::new()
        .add_messages(messages)
        .add_attribute("action", "place_bid")
        .add_attribute("auction_id", auction_id)
        .add_attribute("bidder", info.sender.to_string())
        .add_attribute("bid_amount", bid_amount)
        .add_attribute("nft_contract", auction.nft_contract)
        .add_attribute("token_id", auction.token_id)
    )
}

pub fn settle_auction(
    deps: DepsMut,
    env: Env,
    auction_id: Uint128
) -> Result<Response, ContractError> {
    // retrieve config
    let config = CONFIG.load(deps.storage)?;
    // retrieve auction
    let mut auction = AUCTIONS.load(deps.storage, auction_id.u128())?;
    if auction.is_settled {
        return Err(ContractError::InvalidAuction("already settled".to_string()));
    };
    if env.block.time.seconds() < auction.end_time {
        return Err(ContractError::InvalidAuction("auction is not end".to_string()));
    };
    // distribute fund
    let mut messages: Vec<CosmosMsg> = vec![];
    let protocol_fee = calculate_fee(config.protocol_fee, auction.amount)?;
    let royalty_fee = calculate_fee(auction.royalty_fee, auction.amount)?;
    let seller_amount = auction.amount - (protocol_fee + royalty_fee);
    // protocol fee
    if protocol_fee > Uint128::zero() {
        let protocol_asset = Asset {
            info: AssetInfo::NativeToken {
                denom: auction.denom.clone()
            },
            amount: protocol_fee
        };
        messages.push(protocol_asset.into_msg(config.collector_address.clone())?);
    }
    // royalty
    if royalty_fee > Uint128::zero() {
        let royalty_asset = Asset {
            info: AssetInfo::NativeToken {
                denom: auction.denom.clone()
            },
            amount: royalty_fee
        };
        match auction.creator_address.clone() {
            Some(v) => {
                messages.push(royalty_asset.into_msg(v)?);
            }
            None => {
                return Err(ContractError::InvalidAuction("creator address is not set".to_string())); 
            }
        };
    }
    // seller 
    let seller_asset = Asset {
        info: AssetInfo::NativeToken {
            denom: auction.denom.clone()
        },
        amount: seller_amount
    };
    messages.push(seller_asset.into_msg(auction.seller.clone())?);
    // send nft to bidder
    let bidder = match &auction.bidder {
        Some(v) => v.clone(),
        None => return Err(ContractError::InvalidAuction("invalid bidder".to_string()))
    };
    messages.push(CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: auction.nft_contract.to_string(),
        msg: to_binary(&Cw721ExecuteMsg::TransferNft {
            token_id: auction.token_id.clone(),
            recipient: bidder.to_string()
        })?,
        funds: vec![]
    }));
    // need additional message to check post condition (ex. bidder is now owner of nft) to prevent malicious nft contract
    messages.push(CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: env.contract.address.to_string(),
        msg: to_binary(&ExecuteMsg::SettleHook {
            nft_contract: auction.nft_contract.to_string(),
            token_id: auction.token_id.clone(),
            owner: bidder.to_string()
        })?,
        funds: vec![]
    }));
    // save auction
    auction.is_settled = true;
    AUCTIONS.save(deps.storage, auction_id.u128(), &auction)?;

    // remove auction and auction index from mapping
    NFT_AUCTION_MAPS.remove(deps.storage, (&auction.nft_contract, auction.token_id.clone()));
    AUCTION_ID_BY_SELLER.remove(deps.storage, (&auction.seller, auction.auction_id.u128()));

    if auction.auction_type == AuctionType::Auction {
        AUCTION_ID_BY_ENDTIME.remove(deps.storage, (&auction.nft_contract, auction.end_time, auction.auction_id.u128()));
        AUCTION_ID_BY_AMOUNT.remove(deps.storage, (&auction.nft_contract, auction.amount.u128(),  auction_id.u128()));
        AUCTION_ID_BY_BIDDER.remove(deps.storage, (&bidder, auction.auction_id.u128() ));
    }
    // remove auction from bidder
    Ok(Response::new()
        .add_messages(messages)
        .add_attribute("action", "settle")
        .add_attribute("auction_id", auction_id)
        .add_attribute("nft_contract", auction.nft_contract)
        .add_attribute("token_id", auction.token_id)
        .add_attribute("denom", auction.denom)
        .add_attribute("amount", auction.amount)
        .add_attribute("seller", auction.seller)
    )
}

pub fn settle_hook(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    nft_contract: String,
    token_id: String,
    owner: String
) -> Result<Response, ContractError> {
    if info.sender != env.contract.address {
        return Err(ContractError::Unauthorized{});
    }
    
    // check that bidder is new owner of nft
    let nft_owner = query_nft_owner(deps.as_ref(), nft_contract, token_id)?;
    if nft_owner != deps.api.addr_validate(&owner)? {
        return Err(ContractError::InvalidAsset("invalid owner".to_string()));
    }

    Ok(Response::new()
        .add_attribute("action", "settle_hook"))
}

pub fn admin_cancel_auction(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    auction_id: Uint128
) -> Result<Response, ContractError> {
    // check owner
    only_owner(deps.as_ref(), &env, info)?;
    // cancel auction
    let mut messages: Vec<CosmosMsg> = vec![];
    let auction = AUCTIONS.load(deps.storage, auction_id.u128())?;
    match auction.auction_type {
        AuctionType::BuyNow => {
            messages.extend(_cancel_auction(deps, env, auction_id)?);
        },
        AuctionType::Auction => {
            messages.extend(_cancel_auction(deps, env, auction_id)?);
        }
    }

    Ok(Response::new()
        .add_messages(messages)
        .add_attribute("action", "admin_cancel_auction")
        .add_attribute("auction_id", auction_id)
    )
}

pub fn admin_pause(
    deps: DepsMut,
    env: Env,
    info: MessageInfo
) -> Result<Response, ContractError> {
    // check only owner
    only_owner(deps.as_ref(), &env, info)?;
    let mut state = STATE.load(deps.storage)?;
    state.is_freeze = true;
    STATE.save(deps.storage, &state)?;
    
    Ok(Response::new()
        .add_attribute("action", "admin_pause")
    )
}

pub fn admin_resume(
    deps: DepsMut,
    env: Env,
    info: MessageInfo
) -> Result<Response, ContractError> {
    // check only owner
    only_owner(deps.as_ref(), &env, info)?;
    let mut state = STATE.load(deps.storage)?;
    state.is_freeze = false;
    STATE.save(deps.storage, &state)?;
    
    Ok(Response::new()
        .add_attribute("action", "admin_resume")
    )
}

pub fn admin_change_config(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    protocol_fee: Decimal,
    min_increment: Decimal,
    min_reserve_price: Uint128,
    max_royalty_fee: Decimal,
    duration: u64,
    extension_duration: u64,
    accepted_denom: Vec<String>,
    collector_address: String
) -> Result<Response, ContractError> {
    // check only owner
    only_owner(deps.as_ref(), &env, info)?;
    // change config
    let mut config = CONFIG.load(deps.storage)?;
    config.protocol_fee = protocol_fee;
    config.min_increment = min_increment;
    config.min_reserve_price = min_reserve_price;
    config.max_royalty_fee = max_royalty_fee;
    config.duration = duration;
    config.extension_duration = extension_duration;
    config.accepted_denom = accepted_denom;
    config.collector_address = deps.api.addr_validate(&collector_address)?;

    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("action", "admin_change_config")
    )
}

fn _cancel_auction(
    deps: DepsMut,
    env: Env,
    auction_id: Uint128
) -> Result<Vec<CosmosMsg>, ContractError> {
    // send nft back to seller
    let auction = AUCTIONS.load(deps.storage, auction_id.u128())?;
    let mut messages: Vec<CosmosMsg> = vec![];

    if auction.is_settled {
        return Err(ContractError::InvalidAuction("already settled".to_string()));
    }

    // return nft back to seller
    messages.push(CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: auction.nft_contract.to_string(),
        msg: to_binary(&Cw721ExecuteMsg::TransferNft {
            token_id: auction.token_id.clone(),
            recipient: auction.seller.to_string()
        })?,
        funds: vec![]
    }));
    // need additional message to check post condition (ex. seller is now owner of nft) to prevent malicious nft contract
    AUCTIONS.remove(deps.storage, auction_id.u128());
    // remove from mapping
    NFT_AUCTION_MAPS.remove(deps.storage, (&auction.nft_contract, auction.token_id.clone()));
    AUCTION_ID_BY_SELLER.remove(deps.storage, (&auction.seller, auction.auction_id.u128()));
    NOT_STARTED_AUCTION.remove(deps.storage, (&auction.nft_contract, auction.auction_id.u128()));

    Ok(messages)
}

pub fn check_auction_owner(
    deps: Deps,
    _env: &Env,
    info: MessageInfo,
    auction_id: Uint128
) -> Result<bool, ContractError> {
    // retrieve auction
    let auction = AUCTIONS.load(deps.storage, auction_id.u128())?;
    // check that sender is the owner of the auction
    if info.sender != auction.seller {
        return Err(ContractError::Unauthorized {});
    };
    // check that auction is not started
    if auction.end_time > 0 {
        return Err(ContractError::InvalidAuction("auction is already started".to_string()));
    };
    Ok(true)
}

pub fn only_owner(
    deps: Deps,
    _env: &Env,
    info: MessageInfo
  ) -> Result<bool, ContractError> {
    let config = CONFIG.load(deps.storage)?;
    if info.sender != config.owner {
      return Err(ContractError::Unauthorized {})
    }
    return Ok(true)
}

pub fn only_royalty_admin(
    deps: Deps,
    _env: &Env,
    info: MessageInfo
  ) -> Result<bool, ContractError> {
    let sender = info.sender.clone();
    let royalty_admin_response = ROYALTY_ADMINS.may_load(deps.storage, &sender)?;
    match royalty_admin_response {
        Some(v) => Ok(true),
        None => Err(ContractError::Unauthorized {})
    }
}

pub fn calculate_min_bid_amount(
    min_increment: Decimal,
    amount: Uint128
) -> Result<Uint128, ContractError> {
    let multiplier:Decimal = Decimal::one() + min_increment;
    let min_bid_amount = amount * multiplier;
    Ok(min_bid_amount)
}

pub fn calculate_fee(
    multiplier: Decimal,
    amount: Uint128
) -> Result<Uint128, ContractError> {
    let fee = amount * multiplier;
    Ok(fee)
}