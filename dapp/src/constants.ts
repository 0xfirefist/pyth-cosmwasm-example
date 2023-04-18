// JS Library published by Pyth to help use the price service
import { PriceServiceConnection } from "@pythnetwork/price-service-client";
import { Injective } from "./injective/injective";
import { getNetworkInfo, Network } from "@injectivelabs/networks";

// from https://pyth.network/developers/price-feed-ids
export const INJ_PRICE_FEED_ID =
  "2d9315a88f3019f8efa88dfe9c0f0843712da0bac814461e27733f6b83eb51b3";

// from https://docs.pyth.network/pythnet-price-feeds/cosmwasm
export const PYTH_CONTRACT_ADDR = "inj1z60tg0tekdzcasenhuuwq3htjcd5slmgf7gpez";

// the deployed example contract
// can be find in contracts README.md
export const CONTRACT_ADDR = "inj16rsd39ahdjdyn3zwzmnlkw5egyk0k6yme47zf0";

// from https://docs.pyth.network/pythnet-price-feeds/price-service
export const PRICE_SERVICE_CONN = new PriceServiceConnection(
  "https://xc-testnet.pyth.network"
);

function getMnemonic(): string {
  if (process.env.NEXT_PUBLIC_MNEMONIC === undefined)
    throw new Error("no local mnemonic");
  return process.env.NEXT_PUBLIC_MNEMONIC;
}

export const INJECTIVE_WALLET = new Injective(
  getNetworkInfo(Network.TestnetK8s).grpc,
  getMnemonic()
);
