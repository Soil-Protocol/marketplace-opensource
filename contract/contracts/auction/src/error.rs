use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},
    // Add any other custom errors you like here.
    // Look at https://docs.rs/thiserror/1.0.21/thiserror/ for details.
    #[error("new auction is freezing")]
    AuctionFreeze {},
    #[error("unsupported asset")]
    UnsupportedAsset {},
    #[error("invalid auction: {0}")]
    InvalidAuction(String),
    #[error("invalid auction type: {0}")]
    InvalidAuctionType(String),
    #[error("invalid amount: {0}")]
    InvalidAmount(String),
    #[error("invalid asset: {0}")]
    InvalidAsset(String)
}
