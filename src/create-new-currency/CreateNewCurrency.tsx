import { ConnectButton, useWalletKit } from "@mysten/wallet-kit";
import { TransactionBlock, formatAddress } from "@mysten/sui.js";
import { intoBase64 } from "./pkg";
import { useState } from "react";
import { CHARGE_FEES, EXPLORER_URL, FEE_ADDR } from "../consts";
import { useDispatch, useSelector } from "react-redux";
import { setRawTreasuryCap } from "../store/treasuryCap";
import { State } from "../store";

export function CreateNewCurrency() {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [decimals, setDecimals] = useState("0");
  const [iconUrl, setIconUrl] = useState("");

  function resetForm() {
    setSymbol("");
    setName("");
    setDescription("");
    setDecimals("0");
    setIconUrl("");
  }

  return (
    <div>
      <h2 id="create-new-currency">
        <img
          src="/img/detective-duck.64x64.png"
          width={32}
          alt="Detective duck logo"
        />
        &nbsp;&nbsp;Create a new currency
      </h2>
      <p>
        To create a new currency on Sui, you must publish a package. This
        utility assists you in <b>publishing your own</b>
        .&nbsp;You'll spend slightly less than 1 SUI on gas, storage, and fees.
        Once published, you can mint tokens&nbsp;
        <a href="#mint-tokens">here</a>. You have&nbsp;
        <b>100% control and ownership</b> over your currency.
      </p>

      <p>
        The <i>Symbol</i>&nbsp;field is the only mandatory field. You&nbsp;
        <b>can update</b>
        &nbsp;the metadata&nbsp;<b>at any time</b>&nbsp;
        <a href="#update-metadata">here</a>&nbsp;except for <i>Decimals</i>
        &nbsp;field, which cannot be changed after publishing.
      </p>

      <div>
        <label htmlFor="token-symbol">Symbol*:</label>&nbsp;&nbsp;
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="USDC"
          name="token-symbol"
          id="token-symbol"
          aria-label="token-symbol"
        />
      </div>

      <div>
        <label htmlFor="token-name">Name:</label>&nbsp;&nbsp;
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="USD Coin"
          name="token-name"
          id="token-name"
          aria-label="token-name"
        />
      </div>

      <div>
        <label htmlFor="token-decimals">Decimals:</label>&nbsp;&nbsp;
        <input
          type="number"
          value={decimals}
          onChange={(e) => setDecimals(e.target.value)}
          name="token-decimals"
          id="token-decimals"
          aria-label="token-decimals"
        />
      </div>

      <div>
        <label htmlFor="token-icon-url">Icon image URL:</label>&nbsp;&nbsp;
        <input
          type="text"
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          placeholder="https://www.circle.com/hubfs/usdcoin-ondark.svg"
          name="token-icon-url"
          id="token-icon-url"
          aria-label="token-icon-url"
        />
      </div>

      <label htmlFor="token-description">Description:</label>
      <div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="USDC is a faster, safer, and more efficient way to send,
          spend, and exchange money around the globe. USDC powers apps to
          provide anytime access to payments and financial services."
          name="token-description"
          id="token-description"
          aria-label="token-description"
          rows={6}
          cols={5}
        />
      </div>

      <SendTransaction
        name={name}
        symbol={symbol}
        decimals={Number(decimals)}
        iconUrl={iconUrl}
        description={description}
        reset={resetForm}
      ></SendTransaction>
    </div>
  );
}

function SendTransaction(f: {
  name: string;
  symbol: string;
  decimals: number;
  iconUrl: string;
  description: string;
  reset: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState(<></>);

  const dispatch = useDispatch();
  const network = useSelector<State, string>((state) => state.rpc.network);

  const { signAndExecuteTransactionBlock, isConnected, currentAccount } =
    useWalletKit();

  const handleClick = async () => {
    setError("");
    setOkMsg(<></>);
    setIsConfirming(true);

    try {
      const pkg = intoBase64(f);
      const dependencies = [
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
      ];

      const tx = new TransactionBlock();
      const [upgradeCap] = tx.publish({
        modules: [pkg],
        dependencies,
      });
      tx.transferObjects([upgradeCap], tx.pure(currentAccount!.address));

      if (CHARGE_FEES) {
        let [feeCoin] = tx.splitCoins({ kind: "GasCoin" }, [
          tx.pure(973000000), // 0.9 SUI
        ]);
        tx.transferObjects([feeCoin], tx.pure(FEE_ADDR));
      }

      const { digest, objectChanges: maybeObjectChanges } =
        await signAndExecuteTransactionBlock({
          transactionBlock: tx,
        });
      const objectChanges = maybeObjectChanges || [];

      const digestUrl = `${EXPLORER_URL}/txblock/${digest}?network=${network}`;
      setOkMsg(
        <p style={{ color: "green" }}>
          Transaction ok! Digest&nbsp;
          <a target="_blank" href={digestUrl}>
            {digest}
          </a>
          &nbsp;(takes a few seconds to show in the explorer)
        </p>
      );
      f.reset();

      const cap = objectChanges.find(
        (o) =>
          o.type === "created" && o.objectType.includes("::coin::TreasuryCap<")
      );
      console.log("cap", cap);
      console.log("objectChanges", objectChanges);
      if (cap && cap.type === "created") {
        dispatch(
          setRawTreasuryCap({
            addr: cap.objectId,
            objectType: cap.objectType,
          })
        );
      }

      // TODO: store metadata
      objectChanges.find(
        (o) =>
          o.type === "created" && o.objectType.includes("::coin::CoinMetadata<")
      );
    } catch (error) {
      setError((error as Error).message);
    }

    setIsConfirming(false);
  };

  if (isConnected && currentAccount) {
    return (
      <div>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {okMsg}
        <button onClick={handleClick} disabled={isConfirming}>
          {isConfirming ? (
            <>Confirming ...</>
          ) : (
            <>Ask wallet to create a new currency</>
          )}
        </button>
        as {formatAddress(currentAccount.address)}
      </div>
    );
  } else {
    return (
      <ConnectButton connectText={"Connect wallet to create a new currency"} />
    );
  }
}
