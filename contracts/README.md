# Pyth Injective Example Contract
This contract allows a user to transfer `INJ` equivalent to given amount in `USD` to another user account. 
It uses Pyth prices to calculate the equivalent injective amount. 

The required information to integrate with Pyth can be found [here](https://docs.pyth.network/pythnet-price-feeds/cosmwasm)

The contract code is deployed at code id: `680` and the contract address is `inj16rsd39ahdjdyn3zwzmnlkw5egyk0k6yme47zf0` with the following initial config
```
{
    "price_feed_id":"2d9315a88f3019f8efa88dfe9c0f0843712da0bac814461e27733f6b83eb51b3",
    "pyth_contract_addr":"inj1z60tg0tekdzcasenhuuwq3htjcd5slmgf7gpez"
}
```

Example execute message
```
{
    "send_inj": {
        "usd_amount":"1",
        "to_address":"inj1nrjzadv9uhxxwgn0vgcm8428e3dxuakwvp93nc"
    }
}
```

Example query message
```
{
    "required_funds":{
        "usd_amount":"1"
    }
}
```