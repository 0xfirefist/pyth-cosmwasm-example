import { MsgExecuteContract } from "@injectivelabs/sdk-ts";
import {
  CONTRACT_ADDR,
  INJECTIVE_WALLET,
  INJ_PRICE_FEED_ID,
  PRICE_SERVICE_CONN,
  PYTH_CONTRACT_ADDR,
} from "./constants";
import { Coin } from "@injectivelabs/ts-types";

export async function sendUsd(
  toAddress: string,
  usdAmount: string,
  approximateInj: number
) {
  // get the latest price update for injective
  const vaas = await PRICE_SERVICE_CONN.getLatestVaas([INJ_PRICE_FEED_ID]);

  // get the update fee for this vaa
  const updateFee = await INJECTIVE_WALLET.querySmartContract<Coin>(
    PYTH_CONTRACT_ADDR,
    {
      get_update_fee: {
        vaas,
      },
    }
  );

  // pyth update request
  const pythExecuteMsg = MsgExecuteContract.fromJSON({
    sender: INJECTIVE_WALLET.getAddress(),
    contractAddress: PYTH_CONTRACT_ADDR,
    msg: {
      update_price_feeds: {
        data: vaas,
      },
    },
    funds: [updateFee],
  });

  // send usd request
  const contractExecuteMsg = MsgExecuteContract.fromJSON({
    sender: INJECTIVE_WALLET.getAddress(),
    contractAddress: CONTRACT_ADDR,
    msg: {
      send_inj: {
        usd_amount: usdAmount,
        to_address: toAddress,
      },
    },
    funds: [
      // converting INJ to inj while sending
      // multiplying again by 2 to be able to send more than requrired inj tokens
      { denom: "inj", amount: `${approximateInj * Math.pow(10, 18) * 2}` },
    ],
  });

  const res = await INJECTIVE_WALLET.signAndBroadcastMsg([
    pythExecuteMsg,
    contractExecuteMsg,
  ]);
  alert(`TxHash: ${res.txHash}`);
}
