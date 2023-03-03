use cosmwasm_std::testing::{mock_env, mock_info ,MOCK_CONTRACT_ADDR };
use cosmwasm_std::{
    Api, Querier, StdError, Storage, to_binary, Uint128, Coin, CosmosMsg, WasmMsg, BankMsg, CanonicalAddr, Order, from_binary,
    DepsMut, Env, Timestamp, Addr, Decimal
};
use marketplace::auction::{InstantiateMsg, ConfigResponse, Cw721HookMsg, AuctionResponse, ExecuteMsg,  RoyaltyFeeResponse, RoyaltyResponse, CalculatePriceResponse, AuctionType, RoyaltyAdminResponse, AllRoyaltyListResponse, AllRoyaltyResponse, StateResponse};
use cw721::{Cw721ReceiveMsg, Cw721ExecuteMsg};
use std::str::FromStr;

use crate::contract::{instantiate, execute, query};
use crate::error::ContractError;
use crate::auction::{calculate_fee, calculate_min_bid_amount};
use crate::mock_querier::mock_dependencies;
use crate::querier::{query_config, query_auction, query_royalty_admin, query_royalty_fee, query_calculate_price, query_all_royalty, query_state, query_nft_auction_map};

fn setup_contract(deps: DepsMut, accepted_denom: Vec<String>) {
    let msg = InstantiateMsg {
        protocol_fee: Decimal::from_str("0.01").unwrap(),
        min_reserve_price: Uint128::from(1000u128),
        min_increment: Decimal::from_str("0.1").unwrap(),
        duration: 86400,
        extension_duration: 900,
        accepted_denom: accepted_denom,
        collector_address: "collector".to_string(),
        max_royalty_fee: Decimal::percent(20) // 20%
    };
    let info = mock_info("owner", &[]);
    let env = mock_env();
    let res = instantiate(deps, env, info, msg).unwrap();
    assert_eq!(0, res.messages.len());
}

#[test]
fn proper_initialization() {
    let mut deps = mock_dependencies(&[]);
    setup_contract(deps.as_mut(), vec!["uluna".to_string()]);

    // query contract config
    let config = query_config(deps.as_ref()).unwrap();
    assert_eq!(
        config,
        ConfigResponse {
            owner: "owner".into(),
            protocol_fee: Decimal::percent(1),
            min_reserve_price: Uint128::from(1000u128),
            min_increment: Decimal::percent(10),
            duration: 86400,
            extension_duration: 900,
            accepted_denom: vec!["uluna".to_string()],
            collector_address: "collector".to_string(),
            max_royalty_fee: Decimal::percent(20)
        }
    )
}

#[test]
fn settle_hook() {
    let mut deps = mock_dependencies(&[]);
    setup_contract(deps.as_mut(), vec!["uluna".to_string()]);
    let hook_msg = ExecuteMsg::SettleHook {
        nft_contract: "nft".to_string(),
        token_id: "bitcoin".to_string(),
        owner: "satoshi".to_string()
    };
    deps.querier.with_nft_owner("nft".to_string(), "bitcoin".to_string(), "satoshi".to_string());
    let env = mock_env();
    let info = mock_info("random", &[]);
    let err = execute(deps.as_mut(), env.clone(), info, hook_msg.clone()).unwrap_err();
    match err {
        ContractError::Unauthorized { .. } => {}
        e => panic!("unexcted error: {}", e)
    };
    let info = mock_info(MOCK_CONTRACT_ADDR, &[]);
    execute(deps.as_mut(), env.clone(), info, hook_msg.clone()).unwrap();
    let wrong_msg = ExecuteMsg::SettleHook {
        nft_contract: "nft".to_string(),
        token_id: "bitcoin".to_string(),
        owner: "vitalik".to_string()
    };
    let info = mock_info(MOCK_CONTRACT_ADDR, &[]);
    let err = execute(deps.as_mut(), env.clone(), info, wrong_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAsset { .. } => {}
        e => panic!("unexcted error: {}", e)
    };
}

#[test]
fn create_buynow() {
    let mut deps = mock_dependencies(&[]);
    setup_contract(deps.as_mut(), vec!["uluna".to_string()]);

    // receive nft 
    let env = mock_env();
    let info = mock_info("nft", &[]);
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "satoshi".into(),
        token_id: "bitcoin".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uluna".to_string(),
            reserve_price: Uint128::from(1_000000u128),
            is_instant_sale: true
        }).unwrap()
    };

    let create_buynow_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    let res = execute(deps.as_mut(), env, info, create_buynow_msg).unwrap();
    assert_eq!(0, res.messages.len());

    let auction = query_auction(deps.as_ref(), Uint128::zero()).unwrap();
    assert_eq!(
        auction,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::BuyNow,
            token_id: "bitcoin".to_string(),
            duration: 0,
            end_time: 0,
            denom: "uluna".to_string(),
            amount: Uint128::from(1000000u128),
            bidder: None,
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1000000u128),
            seller: "satoshi".into(),
            is_settled: false,
            creator_address: None,
            royalty_fee: Decimal::zero()
        }
    );

    let auction = query_nft_auction_map(deps.as_ref(), "nft".to_string(), "bitcoin".to_string()).unwrap();
    assert_eq!(
        auction,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::BuyNow,
            token_id: "bitcoin".to_string(),
            duration: 0,
            end_time: 0,
            denom: "uluna".to_string(),
            amount: Uint128::from(1000000u128),
            bidder: None,
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1000000u128),
            seller: "satoshi".into(),
            is_settled: false,
            creator_address: None,
            royalty_fee: Decimal::zero()
        }
    );

    // create auction with very low reserve price
    // receive nft
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "satoshi".into(),
        token_id: "rock".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uluna".to_string(),
            reserve_price: Uint128::from(10u128),
            is_instant_sale: false
        }).unwrap()
    };

    let create_buynow_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    let info = mock_info("nft", &[]);
    let env = mock_env();
    let err = execute(deps.as_mut(), env, info, create_buynow_msg).unwrap_err();
    match err {
        ContractError::InvalidAmount { .. } => {}
        e => panic!("unexcted error: {}", e)
    }

    // create auction with unsupport denom
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "satoshi".into(),
        token_id: "rock".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uthb".to_string(),
            reserve_price: Uint128::from(10u128),
            is_instant_sale: false
        }).unwrap()
    };

    let create_buynow_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    let info = mock_info("nft", &[]);
    let env = mock_env();
    let err = execute(deps.as_mut(), env, info, create_buynow_msg).unwrap_err();
    match err {
        ContractError::UnsupportedAsset { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
}

#[test]
fn create_auction() {
    let mut deps = mock_dependencies(&[]);
    setup_contract(deps.as_mut(), vec!["uluna".to_string()]);

    // receive nft 
    let env = mock_env();
    let info = mock_info("nft", &[]);
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "satoshi".into(),
        token_id: "bitcoin".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uluna".to_string(),
            reserve_price: Uint128::from(1_000000u128),
            is_instant_sale: false
        }).unwrap()
    };

    let create_buynow_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    let res = execute(deps.as_mut(), env, info, create_buynow_msg).unwrap();
    assert_eq!(0, res.messages.len());

    let auction = query_auction(deps.as_ref(), Uint128::zero()).unwrap();
    assert_eq!(
        auction,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::Auction,
            token_id: "bitcoin".to_string(),
            duration: 86400,
            end_time: 0,
            denom: "uluna".to_string(),
            amount: Uint128::from(1000000u128),
            bidder: None,
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1000000u128),
            seller: "satoshi".into(),
            is_settled: false,
            creator_address: None,
            royalty_fee: Decimal::zero()
        }
    );

    let auction = query_nft_auction_map(deps.as_ref(), "nft".to_string(), "bitcoin".to_string()).unwrap();
    assert_eq!(
        auction,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::Auction,
            token_id: "bitcoin".to_string(),
            duration: 86400,
            end_time: 0,
            denom: "uluna".to_string(),
            amount: Uint128::from(1000000u128),
            bidder: None,
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1000000u128),
            seller: "satoshi".into(),
            is_settled: false,
            creator_address: None,
            royalty_fee: Decimal::zero()
        }
    );
}

#[test]
fn settle_buynow() {
    let mut deps = mock_dependencies(&[]);
    setup_contract(deps.as_mut(), vec!["uluna".to_string()]);

    // receive nft 
    let env = mock_env();
    let info = mock_info("nft", &[]);
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "satoshi".into(),
        token_id: "bitcoin".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uluna".to_string(),
            reserve_price: Uint128::from(1_000000u128),
            is_instant_sale: true
        }).unwrap()
    };

    let create_buynow_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    execute(deps.as_mut(), env, info, create_buynow_msg).unwrap();
    // place bid with no fund
    let place_bid_msg = ExecuteMsg::PlaceBid {
        auction_id: Uint128::zero()
    };
    let env = mock_env();
    let info = mock_info("buyer", &[]);
    let err = execute(deps.as_mut(), env, info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAmount { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // place bid with fund in wrong denom
    let env = mock_env();
    let info = mock_info("buyer", &[Coin::new(1_000000, "uusdc")]);
    let err = execute(deps.as_mut(), env, info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAmount { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // place bid with fund in multiple denom
    let env = mock_env();
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uusdc"),
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env, info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAmount { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // place bid with correct fund
    let mut env = mock_env();
    env.block.time = Timestamp::from_seconds(100);
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uluna")]);
    execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap();
    let buynow = query_auction(deps.as_ref(), Uint128::zero()).unwrap();
    assert_eq!(
        buynow,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::BuyNow,
            token_id: "bitcoin".to_string(),
            duration: 0,
            end_time: 100,
            denom: "uluna".to_string(),
            amount: Uint128::from(1_000000u128),
            bidder: Some("buyer".to_string()),
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1_000000u128),
            seller: "satoshi".into(),
            is_settled: false,
            creator_address: None,
            royalty_fee: Decimal::zero()
        }
    );
    // trying to place bid again
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAuction { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // settle
    let settle_msg = ExecuteMsg::Settle {
        auction_id: Uint128::zero()
    };
    env.block.time = Timestamp::from_seconds(120);
    let info = mock_info("random", &vec![]);
    let res = execute(deps.as_mut(), env.clone(), info, settle_msg.clone()).unwrap();
    assert_eq!(4, res.messages.len());

    let send_fund_collector_msg = res.messages.get(0).expect("no message");
    assert_eq!(
        &send_fund_collector_msg.msg,
        &CosmosMsg::Bank(BankMsg::Send {
            to_address: "collector".into(),
            amount: vec![Coin::new(10000, "uluna")]
        }));

    let send_fund_seller_msg = res.messages.get(1).expect("no message");
    assert_eq!(
        &send_fund_seller_msg.msg,
        &CosmosMsg::Bank(BankMsg::Send {
            to_address: "satoshi".into(),
            amount: vec![Coin::new(990000, "uluna")]
        }));
    
    let send_nft_msg = res.messages.get(2).expect("no message");
    assert_eq!(
        &send_nft_msg.msg,
        &CosmosMsg::Wasm(WasmMsg::Execute{
            contract_addr: "nft".into(),
            msg: to_binary(&Cw721ExecuteMsg::TransferNft {
                token_id: "bitcoin".to_string(),
                recipient: "buyer".into()
            }).unwrap(),
            funds: vec![]
        }));

    let settle_hook_msg = res.messages.get(3).expect("no message");
    assert_eq!(
        &settle_hook_msg.msg,
        &CosmosMsg::Wasm(WasmMsg::Execute{
            contract_addr: MOCK_CONTRACT_ADDR.into(),
            msg: to_binary(&ExecuteMsg::SettleHook {
                nft_contract: "nft".to_string(),
                token_id: "bitcoin".to_string(),
                owner: "buyer".to_string()
            }).unwrap(),
            funds: vec![]
        }));

    let buynow = query_auction(deps.as_ref(), Uint128::zero()).unwrap();
    assert_eq!(
        buynow,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::BuyNow,
            token_id: "bitcoin".to_string(),
            duration: 0,
            end_time: 100,
            denom: "uluna".to_string(),
            amount: Uint128::from(1_000000u128),
            bidder: Some("buyer".to_string()),
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1_000000u128),
            seller: "satoshi".into(),
            is_settled: true,
            creator_address: None,
            royalty_fee: Decimal::zero()
        }
    );

    // trying to place bid again
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAuction { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // trying to settle again
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env.clone(), info, settle_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAuction { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
}

#[test]
fn settle_buynow_with_royalty() {
    let mut deps = mock_dependencies(&[]);
    setup_contract(deps.as_mut(), vec!["uluna".to_string()]);

    // set royalty
    let set_royalty_admin_msg = ExecuteMsg::SetRoyaltyAdmin {
        address: "admin".to_string(),
        enable: true
    };
    let info = mock_info("owner", &[]);
    let env = mock_env();
    execute(deps.as_mut(), env, info, set_royalty_admin_msg).unwrap();
    let set_royalty_msg = ExecuteMsg::SetRoyaltyFee {
        contract_addr: "nft".to_string(),
        creator: "creator".to_string(),
        royalty_fee: Decimal::percent(5)
    };
    let info = mock_info("admin", &[]);
    let env = mock_env();
    execute(deps.as_mut(), env, info, set_royalty_msg).unwrap();

    // receive nft 
    let env = mock_env();
    let info = mock_info("nft", &[]);
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "satoshi".into(),
        token_id: "bitcoin".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uluna".to_string(),
            reserve_price: Uint128::from(1_000000u128),
            is_instant_sale: true
        }).unwrap()
    };

    let create_buynow_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    execute(deps.as_mut(), env, info, create_buynow_msg).unwrap();
    // place bid with no fund
    let place_bid_msg = ExecuteMsg::PlaceBid {
        auction_id: Uint128::zero()
    };
    let env = mock_env();
    let info = mock_info("buyer", &[]);
    let err = execute(deps.as_mut(), env, info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAmount { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // place bid with fund in wrong denom
    let env = mock_env();
    let info = mock_info("buyer", &[Coin::new(1_000000, "uusdc")]);
    let err = execute(deps.as_mut(), env, info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAmount { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // place bid with fund in multiple denom
    let env = mock_env();
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uusdc"),
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env, info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAmount { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // place bid with correct fund
    let mut env = mock_env();
    env.block.time = Timestamp::from_seconds(100);
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uluna")]);
    execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap();
    let buynow = query_auction(deps.as_ref(), Uint128::zero()).unwrap();
    assert_eq!(
        buynow,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::BuyNow,
            token_id: "bitcoin".to_string(),
            duration: 0,
            end_time: 100,
            denom: "uluna".to_string(),
            amount: Uint128::from(1_000000u128),
            bidder: Some("buyer".to_string()),
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1_000000u128),
            seller: "satoshi".into(),
            is_settled: false,
            creator_address: Some("creator".to_string()),
            royalty_fee: Decimal::percent(5)
        }
    );
    // trying to place bid again
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAuction { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // settle
    let settle_msg = ExecuteMsg::Settle {
        auction_id: Uint128::zero()
    };
    env.block.time = Timestamp::from_seconds(120);
    let info = mock_info("random", &vec![]);
    let res = execute(deps.as_mut(), env.clone(), info, settle_msg.clone()).unwrap();
    assert_eq!(5, res.messages.len());

    let send_fund_collector_msg = res.messages.get(0).expect("no message");
    assert_eq!(
        &send_fund_collector_msg.msg,
        &CosmosMsg::Bank(BankMsg::Send {
            to_address: "collector".into(),
            amount: vec![Coin::new(10000, "uluna")]
        }));

    let send_fund_creator_msg = res.messages.get(1).expect("no message");
    assert_eq!(
        &send_fund_creator_msg.msg,
        &CosmosMsg::Bank(BankMsg::Send {
            to_address: "creator".into(),
            amount: vec![Coin::new(50000, "uluna")]
        }));

    let send_fund_seller_msg = res.messages.get(2).expect("no message");
    assert_eq!(
        &send_fund_seller_msg.msg,
        &CosmosMsg::Bank(BankMsg::Send {
            to_address: "satoshi".into(),
            amount: vec![Coin::new(940000, "uluna")]
        }));
    
    let send_nft_msg = res.messages.get(3).expect("no message");
    assert_eq!(
        &send_nft_msg.msg,
        &CosmosMsg::Wasm(WasmMsg::Execute{
            contract_addr: "nft".into(),
            msg: to_binary(&Cw721ExecuteMsg::TransferNft {
                token_id: "bitcoin".to_string(),
                recipient: "buyer".into()
            }).unwrap(),
            funds: vec![]
        }));

    let settle_hook_msg = res.messages.get(4).expect("no message");
    assert_eq!(
        &settle_hook_msg.msg,
        &CosmosMsg::Wasm(WasmMsg::Execute{
            contract_addr: MOCK_CONTRACT_ADDR.into(),
            msg: to_binary(&ExecuteMsg::SettleHook {
                nft_contract: "nft".to_string(),
                token_id: "bitcoin".to_string(),
                owner: "buyer".to_string()
            }).unwrap(),
            funds: vec![]
        }));

    let buynow = query_auction(deps.as_ref(), Uint128::zero()).unwrap();
    assert_eq!(
        buynow,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::BuyNow,
            token_id: "bitcoin".to_string(),
            duration: 0,
            end_time: 100,
            denom: "uluna".to_string(),
            amount: Uint128::from(1_000000u128),
            bidder: Some("buyer".to_string()),
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1_000000u128),
            seller: "satoshi".into(),
            is_settled: true,
            creator_address: Some("creator".to_string()),
            royalty_fee: Decimal::percent(5)
        }
    );
    // trying to place bid again
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAuction { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // trying to settle again
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env.clone(), info, settle_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAuction { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
}

#[test]
fn settle_auction() {
    let mut deps = mock_dependencies(&[]);
    setup_contract(deps.as_mut(), vec!["uluna".to_string()]);

    // receive nft 
    let env = mock_env();
    let info = mock_info("nft", &[]);
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "satoshi".into(),
        token_id: "bitcoin".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uluna".to_string(),
            reserve_price: Uint128::from(1_000000u128),
            is_instant_sale: false
        }).unwrap()
    };

    let create_buynow_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    execute(deps.as_mut(), env, info, create_buynow_msg).unwrap();
    // place bid with no fund
    let place_bid_msg = ExecuteMsg::PlaceBid {
        auction_id: Uint128::zero()
    };
    let env = mock_env();
    let info = mock_info("buyer", &[]);
    let err = execute(deps.as_mut(), env, info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAmount { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // place bid with fund in wrong denom
    let env = mock_env();
    let info = mock_info("buyer", &[Coin::new(1_000000, "uusdc")]);
    let err = execute(deps.as_mut(), env, info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAmount { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // place bid with fund in multiple denom
    let env = mock_env();
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uusdc"),
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env, info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAmount { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // place bid with correct fund
    let mut env = mock_env();
    env.block.time = Timestamp::from_seconds(100);
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uluna")]);
    execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap();
    let auction = query_auction(deps.as_ref(), Uint128::zero()).unwrap();
    assert_eq!(
        auction,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::Auction,
            token_id: "bitcoin".to_string(),
            duration: 86400,
            end_time: 86500,
            denom: "uluna".to_string(),
            amount: Uint128::from(1_000000u128),
            bidder: Some("buyer".to_string()),
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1_000000u128),
            seller: "satoshi".into(),
            is_settled: false,
            creator_address: None,
            royalty_fee: Decimal::zero()
        }
    );
    // bid with too low amount
    let info = mock_info("fliper", &[
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAmount { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // same person bid again
    let info = mock_info("buyer", &[
        Coin::new(1_100000, "uluna")]);
    let err = execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAuction { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // fliper bid correctly
    let info = mock_info("fliper", &[
        Coin::new(1_100000, "uluna")]);
    let res = execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap();
    assert_eq!(1, res.messages.len());
    let send_fund_buyer_msg = res.messages.get(0).expect("no message");
    assert_eq!(
        &send_fund_buyer_msg.msg,
        &CosmosMsg::Bank(BankMsg::Send {
            to_address: "buyer".into(),
            amount: vec![Coin::new(1000000, "uluna")]
        }));
    let auction = query_auction(deps.as_ref(), Uint128::zero()).unwrap();
    assert_eq!(
        auction,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::Auction,
            token_id: "bitcoin".to_string(),
            duration: 86400,
            end_time: 86500,
            denom: "uluna".to_string(),
            amount: Uint128::from(1_100000u128),
            bidder: Some("fliper".to_string()),
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1_000000u128),
            seller: "satoshi".into(),
            is_settled: false,
            creator_address: None,
            royalty_fee: Decimal::zero()
        }
    );
    // place bid to cause extension time
    env.block.time = Timestamp::from_seconds(86000);
    let info = mock_info("buyer", &[
        Coin::new(1_210000, "uluna")]);
    let res = execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap();
    assert_eq!(1, res.messages.len());
    let send_fund_fliper_msg = res.messages.get(0).expect("no message");
    assert_eq!(
        &send_fund_fliper_msg.msg,
        &CosmosMsg::Bank(BankMsg::Send {
            to_address: "fliper".into(),
            amount: vec![Coin::new(1100000, "uluna")]
        }));
    let auction = query_auction(deps.as_ref(), Uint128::zero()).unwrap();
    assert_eq!(
        auction,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::Auction,
            token_id: "bitcoin".to_string(),
            duration: 86400,
            end_time: 86900,
            denom: "uluna".to_string(),
            amount: Uint128::from(1_210000u128),
            bidder: Some("buyer".to_string()),
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1_000000u128),
            seller: "satoshi".into(),
            is_settled: false,
            creator_address: None,
            royalty_fee: Decimal::zero()
        }
    );
    // settle when auction not finish
    let settle_msg = ExecuteMsg::Settle {
        auction_id: Uint128::zero()
    };
    let info = mock_info("random", &vec![]);
    let err = execute(deps.as_mut(), env.clone(), info, settle_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAuction { .. } => {}
        e => panic!("unexcted error: {}", e)
    }

    // settle
    env.block.time = Timestamp::from_seconds(86900);
    let info = mock_info("random", &vec![]);
    let res = execute(deps.as_mut(), env.clone(), info, settle_msg.clone()).unwrap();
    assert_eq!(4, res.messages.len());

    let send_fund_collector_msg = res.messages.get(0).expect("no message");
    assert_eq!(
        &send_fund_collector_msg.msg,
        &CosmosMsg::Bank(BankMsg::Send {
            to_address: "collector".into(),
            amount: vec![Coin::new(12100, "uluna")]
        }));

    let send_fund_seller_msg = res.messages.get(1).expect("no message");
    assert_eq!(
        &send_fund_seller_msg.msg,
        &CosmosMsg::Bank(BankMsg::Send {
            to_address: "satoshi".into(),
            amount: vec![Coin::new(1197900, "uluna")]
        }));
    
    let send_nft_msg = res.messages.get(2).expect("no message");
    assert_eq!(
        &send_nft_msg.msg,
        &CosmosMsg::Wasm(WasmMsg::Execute{
            contract_addr: "nft".into(),
            msg: to_binary(&Cw721ExecuteMsg::TransferNft {
                token_id: "bitcoin".to_string(),
                recipient: "buyer".into()
            }).unwrap(),
            funds: vec![]
        }));

    let settle_hook_msg = res.messages.get(3).expect("no message");
    assert_eq!(
        &settle_hook_msg.msg,
        &CosmosMsg::Wasm(WasmMsg::Execute{
            contract_addr: MOCK_CONTRACT_ADDR.into(),
            msg: to_binary(&ExecuteMsg::SettleHook {
                nft_contract: "nft".to_string(),
                token_id: "bitcoin".to_string(),
                owner: "buyer".to_string()
            }).unwrap(),
            funds: vec![]
        }));
        
    let buynow = query_auction(deps.as_ref(), Uint128::zero()).unwrap();
    assert_eq!(
        buynow,
        AuctionResponse {
            auction_id: Uint128::zero(),
            auction_type: AuctionType::Auction,
            token_id: "bitcoin".to_string(),
            duration: 86400,
            end_time: 86900,
            denom: "uluna".to_string(),
            amount: Uint128::from(1_210000u128),
            bidder: Some("buyer".to_string()),
            extension_duration: 900,
            nft_contract: "nft".into(),
            reserve_price: Uint128::from(1_000000u128),
            seller: "satoshi".into(),
            is_settled: true,
            creator_address: None,
            royalty_fee: Decimal::zero()
        }
    );
    // trying to place bid again
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env.clone(), info, place_bid_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAuction { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // trying to settle again
    let info = mock_info("buyer", &[
        Coin::new(1_000000, "uluna")]);
    let err = execute(deps.as_mut(), env.clone(), info, settle_msg.clone()).unwrap_err();
    match err {
        ContractError::InvalidAuction { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
}

#[test]
fn check_freeze_and_cancel_auction() {
    let mut deps = mock_dependencies(&[]);
    setup_contract(deps.as_mut(), vec!["uluna".to_string()]);

    // create buy now
    let env = mock_env();
    let info = mock_info("nft", &[]);
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "satoshi".into(),
        token_id: "bitcoin".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uluna".to_string(),
            reserve_price: Uint128::from(1_000000u128),
            is_instant_sale: true
        }).unwrap()
    };

    let create_buynow_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    execute(deps.as_mut(), env, info, create_buynow_msg).unwrap();
    // create another buynow
    let env = mock_env();
    let info = mock_info("nft", &[]);
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "vitalik".into(),
        token_id: "ethereum".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uluna".to_string(),
            reserve_price: Uint128::from(1_000000u128),
            is_instant_sale: true
        }).unwrap()
    };
    let create_buynow_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    execute(deps.as_mut(), env, info, create_buynow_msg).unwrap();
    // random guy freeze
    let env = mock_env();
    let info = mock_info("random", &[]);
    let freeze_msg = ExecuteMsg::AdminPause {};
    let err = execute(deps.as_mut(), env, info, freeze_msg.clone()).unwrap_err();
    match err {
        ContractError::Unauthorized { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // owner freeze
    let env = mock_env();
    let info = mock_info("owner", &[]);
    execute(deps.as_mut(), env, info, freeze_msg.clone()).unwrap();
    let state = query_state(deps.as_ref()).unwrap();
    assert_eq!(
        state,
        StateResponse {
            is_freeze: true,
            next_auction_id: Uint128::from(2u128)
        }
    );
    // create another buynow
    let env = mock_env();
    let info = mock_info("nft", &[]);
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "charles".into(),
        token_id: "cardano".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uluna".to_string(),
            reserve_price: Uint128::from(1_000000u128),
            is_instant_sale: true
        }).unwrap()
    };

    let create_buynow_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    let err = execute(deps.as_mut(), env, info, create_buynow_msg).unwrap_err();
    match err {
        ContractError::AuctionFreeze { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // place bid
    let env = mock_env();
    let info = mock_info("buyer", &[Coin::new(1_000000, "uluna")]);
    let place_bid_msg = ExecuteMsg::PlaceBid {
        auction_id: Uint128::zero()
    };
    let err = execute(deps.as_mut(), env, info, place_bid_msg).unwrap_err();
    match err {
        ContractError::AuctionFreeze { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // random cancel auction
    let env = mock_env();
    let info = mock_info("random", &[]);
    let cancel_msg = ExecuteMsg::CancelAuction {
        auction_id: Uint128::zero()
    };
    let err = execute(deps.as_mut(), env, info, cancel_msg).unwrap_err();
    match err {
        ContractError::Unauthorized { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // owner cancel auction
    let env = mock_env();
    let info = mock_info("satoshi", &[]);
    let cancel_msg = ExecuteMsg::CancelAuction {
        auction_id: Uint128::zero()
    };
    let res = execute(deps.as_mut(), env, info, cancel_msg).unwrap();
    assert_eq!(2, res.messages.len());

    let send_nft_msg = res.messages.get(0).expect("no message");
    assert_eq!(
        &send_nft_msg.msg,
        &CosmosMsg::Wasm(WasmMsg::Execute{
            contract_addr: "nft".into(),
            msg: to_binary(&Cw721ExecuteMsg::TransferNft {
                token_id: "bitcoin".to_string(),
                recipient: "satoshi".into()
            }).unwrap(),
            funds: vec![]
        }));
    
    let settle_hook_msg = res.messages.get(1).expect("no message");
    assert_eq!(
        &settle_hook_msg.msg,
        &CosmosMsg::Wasm(WasmMsg::Execute{
            contract_addr: MOCK_CONTRACT_ADDR.into(),
            msg: to_binary(&ExecuteMsg::SettleHook {
                nft_contract: "nft".to_string(),
                token_id: "bitcoin".to_string(),
                owner: "satoshi".to_string()
            }).unwrap(),
            funds: vec![]
        }));
    
    // unfreeze
    let env = mock_env();
    let info = mock_info("owner", &[]);
    let unfreeze_msg = ExecuteMsg::AdminResume {};
    execute(deps.as_mut(), env, info, unfreeze_msg).unwrap();

    let state = query_state(deps.as_ref()).unwrap();
    assert_eq!(
        state,
        StateResponse {
            is_freeze: false,
            next_auction_id: Uint128::from(2u128)
        }
    );
    // place bid again
    let env = mock_env();
    let info = mock_info("buyer", &[Coin::new(1_000000, "uluna")]);
    let place_bid_msg = ExecuteMsg::PlaceBid {
        auction_id: Uint128::from(1u128)
    };
    execute(deps.as_mut(), env, info, place_bid_msg).unwrap();
}

#[test]
fn admin_cancel() {
    let mut deps = mock_dependencies(&[]);
    setup_contract(deps.as_mut(), vec!["uluna".to_string()]);

    // receive nft 
    let env = mock_env();
    let info = mock_info("nft", &[]);
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "satoshi".into(),
        token_id: "bitcoin".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uluna".to_string(),
            reserve_price: Uint128::from(1_000000u128),
            is_instant_sale: true
        }).unwrap()
    };

    let create_buynow_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    execute(deps.as_mut(), env, info, create_buynow_msg).unwrap();
    // random admin cancel
    let env = mock_env();
    let info = mock_info("satoshi", &[]);
    let admin_cancel_msg = ExecuteMsg::AdminCancelAuction {
        auction_id: Uint128::zero()
    };
    let err = execute(deps.as_mut(), env, info, admin_cancel_msg).unwrap_err();
    match err {
        ContractError::Unauthorized { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // admin cancel
    let env = mock_env();
    let info = mock_info("owner", &[]);
    let admin_cancel_msg = ExecuteMsg::AdminCancelAuction {
        auction_id: Uint128::zero()
    };
    let res = execute(deps.as_mut(), env, info, admin_cancel_msg).unwrap();
    assert_eq!(1, res.messages.len());
    let send_nft_msg = res.messages.get(0).expect("no message");
    assert_eq!(
        &send_nft_msg.msg,
        &CosmosMsg::Wasm(WasmMsg::Execute{
            contract_addr: "nft".into(),
            msg: to_binary(&Cw721ExecuteMsg::TransferNft {
                token_id: "bitcoin".to_string(),
                recipient: "satoshi".into()
            }).unwrap(),
            funds: vec![]
        }));
    // create another auction
    let env = mock_env();
    let info = mock_info("nft", &[]);
    let nft_receive_msg = Cw721ReceiveMsg {
        sender: "satoshi".into(),
        token_id: "bitcoin".to_string(),
        msg: to_binary(&Cw721HookMsg::CreateAuction {
            denom: "uluna".to_string(),
            reserve_price: Uint128::from(1_000000u128),
            is_instant_sale: false
        }).unwrap()
    };

    let create_auction_msg = ExecuteMsg::ReceiveNft(nft_receive_msg);
    execute(deps.as_mut(), env, info, create_auction_msg).unwrap();
    // place bid
    let env = mock_env();
    let info = mock_info("buyer", &[Coin::new(1_000000, "uluna")]);
    let place_bid_msg = ExecuteMsg::PlaceBid {
        auction_id: Uint128::from(1u128)
    };
    execute(deps.as_mut(), env, info, place_bid_msg).unwrap();
    // owner cancel
    let env = mock_env();
    let info = mock_info("satoshi", &[]);
    let cancel_msg = ExecuteMsg::CancelAuction {
        auction_id: Uint128::from(1u128)
    };
    let err = execute(deps.as_mut(), env, info, cancel_msg).unwrap_err();
    match err {
        ContractError::InvalidAuction { .. } => {}
        e => panic!("unexcted error: {}", e)
    }
    // admin cancel
    let env = mock_env();
    let info = mock_info("owner", &[]);
    let admin_cancel_msg = ExecuteMsg::AdminCancelAuction {
        auction_id: Uint128::from(1u128)
    };
    let res = execute(deps.as_mut(), env, info, admin_cancel_msg).unwrap();
    assert_eq!(2, res.messages.len());

    let send_fund_bidder_msg = res.messages.get(0).expect("no message");
    assert_eq!(
        &send_fund_bidder_msg.msg,
        &CosmosMsg::Bank(BankMsg::Send {
            to_address: "buyer".into(),
            amount: vec![Coin::new(1000000, "uluna")]
        }));

    let send_nft_msg = res.messages.get(1).expect("no message");
    assert_eq!(
        &send_nft_msg.msg,
        &CosmosMsg::Wasm(WasmMsg::Execute{
            contract_addr: "nft".into(),
            msg: to_binary(&Cw721ExecuteMsg::TransferNft {
                token_id: "bitcoin".to_string(),
                recipient: "satoshi".into()
            }).unwrap(),
            funds: vec![]
        }));
}

#[test]
fn set_royalty() {
    let mut deps = mock_dependencies(&[]);
    setup_contract(deps.as_mut(), vec!["uluna".to_string()]);

    let set_royalty_msg = ExecuteMsg::SetRoyaltyFee {
        contract_addr: "nft".to_string(),
        creator: "creator".to_string(),
        royalty_fee: Decimal::from_str("0.05").unwrap()
    };
    // random guy set royalty
    let info = mock_info("random", &[]);
    let env = mock_env();
    let err = execute(deps.as_mut(), env, info, set_royalty_msg.clone()).unwrap_err();
    match err {
        ContractError::Unauthorized { } => {}
        e => panic!("unexcted error: {}", e)
    }
    // owner set royalty
    let info = mock_info("owner", &[]);
    let env = mock_env();
    let err = execute(deps.as_mut(), env, info, set_royalty_msg.clone()).unwrap_err();
    match err {
        ContractError::Unauthorized { } => {}
        e => panic!("unexcted error: {}", e)
    }
    // owner set royalty admin
    let set_royalty_admin_msg = ExecuteMsg::SetRoyaltyAdmin {
        address: "admin1".to_string(),
        enable: true
    };
    let info = mock_info("owner", &[]);
    let env = mock_env();
    execute(deps.as_mut(), env, info, set_royalty_admin_msg.clone()).unwrap();
    // query royalty admin
    let config = query_royalty_admin(deps.as_ref(), "admin1".to_string()).unwrap();
    assert_eq!(
        config,
        RoyaltyAdminResponse {
            address: "admin1".to_string(),
            enable: true
        }
    );
    // set royalty
    let info = mock_info("admin1", &[]);
    let env = mock_env();
    execute(deps.as_mut(), env, info, set_royalty_msg.clone()).unwrap();
    let royalty = query_royalty_fee(deps.as_ref(), "nft".to_string()).unwrap();
    assert_eq!(
        royalty,
        RoyaltyFeeResponse {
            royalty_fee: Some(RoyaltyResponse {
                royalty_fee: Decimal::percent(5),
                creator: "creator".to_string()
            })
        }
    );
    let price = query_calculate_price(deps.as_ref(), "nft".to_string(), "bitcoin".to_string(), Uint128::from(1_000000u128)).unwrap();
    assert_eq!(
        price,
        CalculatePriceResponse {
            nft_contract: "nft".to_string(),
            token_id: "bitcoin".to_string(),
            amount: Uint128::from(1_000000u128),
            protocol_fee: Uint128::from(10000u128),
            royalty_fee: Uint128::from(50000u128),
            seller_amount: Uint128::from(940000u128)
        }
    );
    // add another royalty
    let set_royalty_msg = ExecuteMsg::SetRoyaltyFee {
        contract_addr: "nft2".to_string(),
        creator: "creator".to_string(),
        royalty_fee: Decimal::from_str("0.1").unwrap()
    };
    let info = mock_info("admin1", &[]);
    let env = mock_env();
    execute(deps.as_mut(), env, info, set_royalty_msg.clone()).unwrap();
    // list all royalty
    let royalties = query_all_royalty(deps.as_ref(), None, Some(100)).unwrap();
    assert_eq!(
        royalties,
        AllRoyaltyListResponse {
            royalty_fees: vec!(
                AllRoyaltyResponse {
                    contract_addr: "nft".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(5)
                },
                AllRoyaltyResponse {
                    contract_addr: "nft2".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(10)
                }
            )
        }
    );
    // revoke royalty admin
    let set_royalty_admin_msg = ExecuteMsg::SetRoyaltyAdmin {
        address: "admin1".to_string(),
        enable: false
    };
    let info = mock_info("owner", &[]);
    let env = mock_env();
    execute(deps.as_mut(), env, info, set_royalty_admin_msg.clone()).unwrap();
    // query royalty admin
    let config = query_royalty_admin(deps.as_ref(), "admin1".to_string()).unwrap();
    assert_eq!(
        config,
        RoyaltyAdminResponse {
            address: "admin1".to_string(),
            enable: false
        }
    );
    let set_royalty_msg = ExecuteMsg::SetRoyaltyFee {
        contract_addr: "nft".to_string(),
        creator: "creator".to_string(),
        royalty_fee: Decimal::from_str("0.1").unwrap()
    };
    let info = mock_info("admin1", &[]);
    let env = mock_env();
    let err = execute(deps.as_mut(), env, info, set_royalty_msg.clone()).unwrap_err();
    match err {
        ContractError::Unauthorized { } => {}
        e => panic!("unexcted error: {}", e)
    }
}

#[test]
fn query_multiple_royalties() {
    let mut deps = mock_dependencies(&[]);
    setup_contract(deps.as_mut(), vec!["uluna".to_string()]);

    let set_royalty_admin_msg = ExecuteMsg::SetRoyaltyAdmin {
        address: "admin".to_string(),
        enable: true
    };
    let info = mock_info("owner", &[]);
    let env = mock_env();
    execute(deps.as_mut(), env, info, set_royalty_admin_msg.clone()).unwrap();

    let mut i:u64 = 1;
    while i <= 10 {
        let mut contract_addr = "nft".to_owned(); 
        contract_addr.push_str(&i.to_string());
        let set_royalty_msg = ExecuteMsg::SetRoyaltyFee {
            contract_addr,
            creator: "creator".to_string(),
            royalty_fee: Decimal::percent(i)
        };
        let info = mock_info("admin", &[]);
        let env = mock_env();
        execute(deps.as_mut(), env, info, set_royalty_msg.clone()).unwrap();
        i += 1;
    }

    // list all royalty
    let royalties = query_all_royalty(deps.as_ref(), None, Some(2)).unwrap();
    assert_eq!(
        royalties,
        AllRoyaltyListResponse {
            royalty_fees: vec![
                AllRoyaltyResponse {
                    contract_addr: "nft1".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(1)
                },
                AllRoyaltyResponse {
                    contract_addr: "nft10".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(10)
                }
            ]
        }
    );
    let royalties = query_all_royalty(deps.as_ref(), Some("nft10".to_string()), Some(5)).unwrap();
    assert_eq!(
        royalties,
        AllRoyaltyListResponse {
            royalty_fees: vec![
                AllRoyaltyResponse {
                    contract_addr: "nft2".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(2)
                },
                AllRoyaltyResponse {
                    contract_addr: "nft3".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(3)
                },
                AllRoyaltyResponse {
                    contract_addr: "nft4".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(4)
                },
                AllRoyaltyResponse {
                    contract_addr: "nft5".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(5)
                },
                AllRoyaltyResponse {
                    contract_addr: "nft6".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(6)
                }
            ]
        }
    );
    let royalties = query_all_royalty(deps.as_ref(), Some("nft6".to_string()), Some(5)).unwrap();
    assert_eq!(
        royalties,
        AllRoyaltyListResponse {
            royalty_fees: vec![
                AllRoyaltyResponse {
                    contract_addr: "nft7".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(7)
                },
                AllRoyaltyResponse {
                    contract_addr: "nft8".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(8)
                },
                AllRoyaltyResponse {
                    contract_addr: "nft9".to_string(),
                    creator: "creator".to_string(),
                    royalty_fee: Decimal::percent(9)
                }
            ]
        }
    );
    let royalties = query_all_royalty(deps.as_ref(), Some("nft9".to_string()), Some(5)).unwrap();
    assert_eq!(
        royalties,
        AllRoyaltyListResponse {
            royalty_fees: vec![]
        }
    );
}