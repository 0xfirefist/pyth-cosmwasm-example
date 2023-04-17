use cosmwasm_std::{
    coin, coins, entry_point, has_coins, to_binary, BankMsg, Binary, Coin, Deps, DepsMut, Env,
    MessageInfo, Response, StdError, StdResult,
};
use pyth_sdk_cw::query_price_feed;

use crate::{
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, RequiredFundsResponse},
    state::{State, STATE},
};

const INJ_EXPO: i32 = 18;

/// The instantiate function is invoked when the contract is first deployed.
/// This function sets configuration values that are used by the query function.
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    // It is a good practice that your contract stores the pyth contract address and ids of the
    // price feeds it needs upon instantiation or by an authorized approach. This will ensure
    // that a wrong address won't be used.
    let state = State {
        pyth_contract_addr: deps.api.addr_validate(msg.pyth_contract_addr.as_ref())?,
        price_feed_id: msg.price_feed_id,
    };
    STATE.save(deps.storage, &state)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("price_id", format!("{}", msg.price_feed_id)))
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::SendInj {
            usd_amount,
            to_address,
        } => {
            // to get the stored pyth contract addr and price feed id
            let state = STATE.load(deps.storage)?;

            // query the current price stored in pyth contract
            let price_feed_response =
                query_price_feed(&deps.querier, state.pyth_contract_addr, state.price_feed_id)?;

            // check if price is not older than 60 seconds
            let price_or_none = price_feed_response
                .price_feed
                .get_price_no_older_than(env.block.time.seconds() as i64, 60);

            match price_or_none {
                Some(price) => {
                    if price.price < 0 {
                        return Err(StdError::generic_err("price received is negative"));
                    }

                    // calculate the amount required in 'inj'
                    // based on the given usd amount

                    // to know about the best practices to use prices see below
                    // https://docs.pyth.network/pythnet-price-feeds/best-practices
                    let amount_in_inj: u128;
                    if  INJ_EXPO - price.expo >= 0 {
                        amount_in_inj = usd_amount
                            .checked_mul(
                                10_u128
                                    .checked_pow((INJ_EXPO - price.expo) as u32)
                                    .ok_or(StdError::generic_err("overflow error"))?
                            )
                            .ok_or(StdError::generic_err("overflow error"))?
                            .checked_div(price.price as u128)
                            .ok_or(StdError::generic_err("overflow error"))?;
                    } else {
                        amount_in_inj = usd_amount
                        .checked_div(
                            10_u128
                                .checked_pow((price.expo - INJ_EXPO) as u32)
                                .ok_or(StdError::generic_err("overflow error"))?
                        )
                        .ok_or(StdError::generic_err("overflow error"))?
                        .checked_div(price.price as u128)
                        .ok_or(StdError::generic_err("overflow error"))?;
                    }

                    // after calculating we need to make sure if the sender has send at least the required amount
                    if has_coins(info.funds.as_ref(), &coin(amount_in_inj, "inj")) {
                        Ok(Response::new()
                            .add_message(BankMsg::Send {
                                to_address,
                                amount: coins(amount_in_inj, "inj"),
                            })
                            // after deducting the amount we need to transfer the remaining amount back
                            .add_message(BankMsg::Send {
                                to_address: info.sender.into_string(),
                                amount: info
                                    .funds
                                    .into_iter()
                                    .map(|coin| {
                                        if coin.denom == "inj" {
                                            let amount = coin.amount.u128() - amount_in_inj;
                                            return Coin::new(amount, "inj");
                                        }
                                        coin
                                    })
                                    .collect(),
                            }))
                    } else {
                        Err(StdError::generic_err("insufficient funds"))
                    }
                }
                None => Err(StdError::generic_err("No recent price found")),
            }
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::RequiredFunds { usd_amount } => {
            // to get the stored pyth contract addr and price feed id
            let state = STATE.load(deps.storage)?;

            // query the current price stored in pyth contract
            let price_feed_response =
                query_price_feed(&deps.querier, state.pyth_contract_addr, state.price_feed_id)?;

            // check if price is not older than 60 seconds
            let price_or_none = price_feed_response
                .price_feed
                .get_price_no_older_than(env.block.time.seconds() as i64, 60);

            match price_or_none {
                Some(price) => {
                    if price.price < 0 {
                        return Err(StdError::generic_err("price received is negative"));
                    }

                    // 1 INJ = x USD
                    // y USD = y/x INJ

                    // calculate the amount required in 'inj'
                    // based on the given usd amount

                    // to know about the best practices to use prices see below
                    // https://docs.pyth.network/pythnet-price-feeds/best-practices
                    let amount_in_inj: u128;
                    if  INJ_EXPO - price.expo >= 0 {
                        amount_in_inj = usd_amount
                            .checked_mul(
                                10_u128
                                    .checked_pow((INJ_EXPO - price.expo) as u32)
                                    .ok_or(StdError::generic_err("overflow error"))?
                            )
                            .ok_or(StdError::generic_err("overflow error"))?
                            .checked_div(price.price as u128)
                            .ok_or(StdError::generic_err("overflow error"))?;
                    } else {
                        amount_in_inj = usd_amount
                        .checked_div(
                            10_u128
                                .checked_pow((price.expo - INJ_EXPO) as u32)
                                .ok_or(StdError::generic_err("overflow error"))?
                        )
                        .ok_or(StdError::generic_err("overflow error"))?
                        .checked_div(price.price as u128)
                        .ok_or(StdError::generic_err("overflow error"))?;
                    }

                    Ok(to_binary(&RequiredFundsResponse {
                        required_amount: amount_in_inj,
                    })?)
                }
                None => Err(StdError::generic_err("No recent price found")),
            }
        }
    }
}
