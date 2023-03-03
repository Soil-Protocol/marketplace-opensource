use cosmwasm_std::{
    Api, Binary, Env, Querier, StdError, Deps, DepsMut, MessageInfo,
    StdResult, Storage, from_binary, to_binary, Uint128, entry_point,
    Response
};
use marketplace::auction::{InstantiateMsg, ExecuteMsg, QueryMsg, Cw721HookMsg, MigrateMsg};
use cw721::Cw721ReceiveMsg;

use crate::error::ContractError;
use crate::state::{CONFIG, Config, STATE, State};
use crate::auction::{create_auction, place_bid, settle_auction, set_royalty_fee, cancel_auction, admin_cancel_auction, admin_resume, 
    admin_pause, admin_change_config, set_royalty_admin, settle_hook};
use crate::querier::{query_config, query_auction, query_state, query_royalty_fee, query_royalty_admin, query_auction_by_nft,
    query_all_royalty, query_calculate_price, query_nft_auction_map, query_bid_history_by_auction_id, query_auction_by_seller,
    query_auction_by_end_time, query_auction_by_amount, query_bid_number, construct_action_response, query_not_started_auctions,
    query_auction_by_bidder
};

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let config = Config {
        owner: info.sender.clone(),
        protocol_fee: msg.protocol_fee,
        min_reserve_price: msg.min_reserve_price,
        max_royalty_fee: msg.max_royalty_fee,
        duration: msg.duration,
        extension_duration: msg.extension_duration,
        min_increment: msg.min_increment,
        accepted_denom: msg.accepted_denom,
        collector_address: deps.api.addr_validate(&msg.collector_address)?
    };

    CONFIG.save(deps.storage, &config)?;

    let state = State {
        next_auction_id: Uint128::zero(),
        is_freeze: false
    };

    STATE.save(deps.storage, &state)?;
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::ReceiveNft(msg) => receive_nft(deps, env, info, msg),
        ExecuteMsg::PlaceBid { auction_id } => place_bid(deps, env, info, auction_id),
        ExecuteMsg::Settle { auction_id } => settle_auction(deps, env, auction_id),
        ExecuteMsg::CancelAuction { auction_id } => cancel_auction(deps, env, info, auction_id),
        ExecuteMsg::AdminCancelAuction { auction_id } => admin_cancel_auction(deps, env, info, auction_id),
        ExecuteMsg::AdminPause {  } => admin_pause(deps, env, info),
        ExecuteMsg::AdminResume {  } => admin_resume(deps, env, info),
        ExecuteMsg::AdminChangeConfig { protocol_fee, min_increment, min_reserve_price, max_royalty_fee, duration, extension_duration, accepted_denom, collector_address } => admin_change_config(deps, env, info, protocol_fee, min_increment, min_reserve_price, max_royalty_fee, duration, extension_duration, accepted_denom, collector_address),
        ExecuteMsg::SetRoyaltyFee { contract_addr, royalty_fee, creator } =>  set_royalty_fee(deps, env, info, contract_addr, creator, royalty_fee),
        ExecuteMsg::SetRoyaltyAdmin { address, enable } => set_royalty_admin(deps, env, info, address, enable),
        ExecuteMsg::SettleHook { nft_contract, token_id, owner } => settle_hook(deps, env, info, nft_contract, token_id, owner)
    }
}

pub fn receive_nft(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    cw721_msg: Cw721ReceiveMsg,
) -> Result<Response, ContractError> {
    match from_binary(&cw721_msg.msg) {
        Ok(Cw721HookMsg::CreateAuction { denom, reserve_price, is_instant_sale }) => {
            // need to check that this contract is owner of nft to prevent malicious contract call this function directly

            let seller = deps.api.addr_validate(&cw721_msg.sender)?;
            let nft_contract = info.sender.clone();
            let token_id = cw721_msg.token_id.clone();
            create_auction(deps, env, nft_contract, token_id.clone(), seller, denom, reserve_price, is_instant_sale)
        }
        Err(err) => Err(ContractError::Std(StdError::generic_err(err.to_string())))
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_binary(&query_config(deps)?),
        QueryMsg::State {} => to_binary(&query_state(deps)?),
        QueryMsg::Auction { auction_id } => to_binary(&query_auction(deps, auction_id)?),
        QueryMsg::RoyaltyFee{ contract_addr } => to_binary(&query_royalty_fee(deps, contract_addr)?),
        QueryMsg::RoyaltyAdmin { address } => to_binary(&query_royalty_admin(deps, address)?),
        QueryMsg::AllRoyaltyFee { start_after, limit} => to_binary(&query_all_royalty(deps,start_after, limit)?),
        QueryMsg::CalculatePrice { nft_contract, token_id, amount } => to_binary(&query_calculate_price(deps, nft_contract, token_id, amount)?),
        QueryMsg::NftAuction { nft_contract, token_id } => to_binary(&query_nft_auction_map(deps, nft_contract, token_id)?),
        QueryMsg::BidHistoryByAuctionId{ auction_id, limit } => to_binary(&query_bid_history_by_auction_id(deps, auction_id, limit)?),
        QueryMsg::BidsCount{ auction_id } => to_binary(&query_bid_number(deps, auction_id)?),
        QueryMsg::AuctionByContract{ nft_contract, limit } => {
            let auction_ids = query_auction_by_nft(deps, nft_contract, limit)?;
            to_binary(&construct_action_response(deps, auction_ids)?)
        }
        ,
        QueryMsg::AuctionBySeller{ seller, limit } => {
            let auction_ids = query_auction_by_seller(deps, seller, limit)?;
            to_binary(&construct_action_response(deps, auction_ids)?)
        },
        QueryMsg::AuctionByEndTime{ nft_contract, end_time, limit, is_desc}  => {
            let auction_ids = query_auction_by_end_time(deps, nft_contract, end_time ,limit, is_desc)?;
            to_binary(&construct_action_response(deps, auction_ids)?)
        },
        QueryMsg::AuctionByAmount{ nft_contract, amount, limit }  => {
            let auction_ids = query_auction_by_amount(deps, nft_contract, amount ,limit)?;
            to_binary(&construct_action_response(deps, auction_ids)?)
        },
        QueryMsg::NotStartedAuction{ nft_contract, start_after, limit, is_desc } => {
            let auction_ids = query_not_started_auctions(deps, nft_contract, start_after, limit, is_desc)?;
            to_binary(&construct_action_response(deps, auction_ids)?)
        }
        QueryMsg::AuctionByBidder{ bidder, start_after, limit  } => {
            let auction_ids = query_auction_by_bidder(deps, bidder, start_after, limit)?;
            to_binary(&construct_action_response(deps, auction_ids)?)
        }
     }
}


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: MigrateMsg) -> Result<Response, ContractError> {
    Ok(Response::default())
}