use cosmwasm_schema::{cw_serde, QueryResponses};
use pyth_sdk_cw::PriceIdentifier;

#[cw_serde]
pub struct InstantiateMsg {
    pub price_feed_id:      PriceIdentifier,
    pub pyth_contract_addr: String,
}

#[cw_serde]
#[derive(Eq)]
pub enum ExecuteMsg {
    SendInj { usd_amount: u128, to_address: String }
}

#[cw_serde]
#[derive(Eq)]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(RequiredFundsResponse)]
    RequiredFunds { usd_amount: u128 }
}


#[cw_serde]
#[derive(Eq)]
pub struct RequiredFundsResponse {
    pub required_amount: u128
}
