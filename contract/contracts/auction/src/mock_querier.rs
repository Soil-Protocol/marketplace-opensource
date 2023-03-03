use cosmwasm_std::testing::{MockApi, MockQuerier, MockStorage, MOCK_CONTRACT_ADDR};
use cosmwasm_std::{
    from_slice, to_binary, Api, Coin, Decimal, Querier, OwnedDeps,
    QuerierResult, QueryRequest, SystemError, Uint128, WasmQuery, from_binary,
    SystemResult, ContractResult, Addr, Empty
};
use std::collections::HashMap;
use std::marker::PhantomData;
use cw721::{Cw721QueryMsg, OwnerOfResponse};

/// mock_dependencies is a drop-in replacement for cosmwasm_std::testing::mock_dependencies
/// this uses our CustomQuerier.
pub fn mock_dependencies(
    contract_balance: &[Coin],
) -> OwnedDeps<MockStorage, MockApi, WasmMockQuerier, Empty> {
    let custom_querier: WasmMockQuerier = WasmMockQuerier::new(MockQuerier::new(&[(MOCK_CONTRACT_ADDR, contract_balance)]));

    OwnedDeps {
        storage: MockStorage::default(),
        api: MockApi::default(),
        querier: custom_querier,
        custom_query_type: PhantomData
    }
}

pub struct WasmMockQuerier {
    base: MockQuerier<Empty>,
    nft_querier: NftQuerier
}

#[derive(Clone, Default)]
pub struct NftQuerier {
    owners: HashMap<String, HashMap<String, String>>,
}

impl NftQuerier {
    pub fn new() -> Self {
        NftQuerier {
            owners: HashMap::new()
        }
    }
}

impl Querier for WasmMockQuerier {
    fn raw_query(&self, bin_request: &[u8]) -> QuerierResult {
        // MockQuerier doesn't support Custom, so we ignore it completely here
        let request: QueryRequest<Empty> = match from_slice(bin_request) {
            Ok(v) => v,
            Err(e) => {
                return SystemResult::Err(SystemError::InvalidRequest {
                    error: format!("Parsing query request: {}", e),
                    request: bin_request.into(),
                })
            }
        };
        self.handle_query(&request)
    }
}

impl WasmMockQuerier {
    pub fn handle_query(&self, request: &QueryRequest<Empty>) -> QuerierResult {
        match &request {
            QueryRequest::Wasm(WasmQuery::Smart { contract_addr, msg }) => {
                match from_binary(msg).unwrap() {
                    Cw721QueryMsg::OwnerOf { token_id, .. } => {
                        let nft_owners = self.nft_querier.owners.get(contract_addr).unwrap();
                        let owner = nft_owners.get(&token_id).unwrap();
                        SystemResult::Ok(ContractResult::Ok(to_binary(&OwnerOfResponse {
                            owner: owner.clone(),
                            approvals: vec![]
                        }).unwrap()))
                    
                    },
                    _ => panic!("DO NOT ENTER HERE")
                }
            }
            _ => self.base.handle_query(request),
        }
    }
}

impl WasmMockQuerier {
    pub fn new (
        base: MockQuerier<Empty>
    ) -> Self {
        WasmMockQuerier {
            base,
            nft_querier: NftQuerier::default()
        }
    }

    // configure the token owner mock querier
    pub fn with_balance(&mut self, balances: &[(String, &[Coin])]) {
        for (addr, balance) in balances {
            self.base.update_balance(addr, balance.to_vec());
        }
    }

    // configure owner of nft
    pub fn with_nft_owner(&mut self, nft_address: String, token_id: String, owner: String) {
        let exist = self.nft_querier.owners.contains_key(&nft_address);
        if !exist {
            self.nft_querier.owners.insert(nft_address.clone(), HashMap::new());
        }
        let owner_map = self.nft_querier.owners.get_mut(&nft_address).unwrap();
        owner_map.insert(token_id.clone(), owner.clone());
    }
}