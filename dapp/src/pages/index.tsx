import Image from "next/image";
import PythLogo from "@/images/pyth_logomark_white.svg";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Price } from "@pythnetwork/price-service-client";
import {
  INJECTIVE_WALLET,
  INJ_PRICE_FEED_ID,
  PRICE_SERVICE_CONN,
} from "@/constants";
import { sendUsd } from "@/helper";

export default function Home() {
  const [friendAddress, setFriendAddress] = useState("");
  const [price, setPrice] = useState<Price>();
  const usdAmount = "10";

  // here we are subscribing to the price service to get the latest price updates
  useEffect(() => {
    PRICE_SERVICE_CONN.subscribePriceFeedUpdates(
      [INJ_PRICE_FEED_ID],
      (priceFeed) => {
        setPrice(priceFeed.getPriceUnchecked());
      }
    );
  }, []);

  // calculating approxmiate INJ equivalent to usdAmount
  const approximateInj = useMemo(() => {
    return price === undefined
      ? undefined
      : Number(usdAmount) / (Number(price.price) * Math.pow(10, price.expo));
  }, [price]);

  const onClick = useCallback(() => {
    if (friendAddress === "") return;
    if (approximateInj === undefined) return;

    console.log(friendAddress, usdAmount, approximateInj);

    sendUsd(friendAddress, usdAmount, approximateInj);
  }, [friendAddress, approximateInj]);

  return (
    <main className="bg- h-screen w-screen">
      <Image src={PythLogo} alt="pyth logo" className="w-2/12 mx-auto py-6" />
      <h1 className="text-5xl text-center pb-4">
        Send {usdAmount}$ worth of INJ to a friend
      </h1>
      <h3 className="text-3xl text-center">
        Current INJ/USD price is:{" "}
        <span className="text-green-800">
          {price === undefined
            ? ""
            : `${(Number(price.price) * Math.pow(10, price.expo)).toFixed(
                4
              )} +/- ${(Number(price.conf) * Math.pow(10, price.expo)).toFixed(
                4
              )}`}
        </span>
      </h3>
      <h3 className="text-3xl text-center">
        ${usdAmount} is worth:
        <span className="text-red-800">
          {approximateInj === undefined
            ? ""
            : `${approximateInj.toFixed(4)} INJ`}
        </span>
      </h3>
      <h3 className="text-3xl text-center">
        Your address:{" "}
        <span className="text-yellow-600">{INJECTIVE_WALLET.getAddress()}</span>
      </h3>
      <h3 className="text-3xl text-center">Your friend&apos;s address: </h3>
      <div className="w-screen mx-auto flex justify-center gap-8">
        <input
          value={friendAddress}
          onChange={(e) => setFriendAddress(e.target.value)}
          className="w-4/12 px-3/12 rounded-md text-black"
        />
        <button className="border-4 px-6 rounded-md" onClick={onClick}>
          Send
        </button>
      </div>
    </main>
  );
}
