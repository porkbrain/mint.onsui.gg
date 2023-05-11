import { ConnectButton, useWalletKit } from "@mysten/wallet-kit";
import { TransactionBlock, formatAddress } from "@mysten/sui.js";
import { intoBase64 } from "./pkg";
import { useState } from "react";
import { FEE_ADDR } from "../consts";

export function CreateNewCurrency() {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [decimals, setDecimals] = useState("0");
  const [iconUrl, setIconUrl] = useState("");

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
        To create a new currency on Sui, you need to publish a package. This
        utility helps you <b>publish your own</b>
        .&nbsp;You'll spend slightly less than 1 SUI on gas, storage and fee.
        Once published, you'll be able to mint tokens&nbsp;
        <a href="#mint-tokens">here</a>. You have&nbsp;
        <b>100% control and ownership</b> over your tokens. Nothing leaves your
        browser.
      </p>

      <p>
        <i>Symbol</i>&nbsp;is the only mandatory field. Other fields are used by
        the wallets to pretty-display your currency. You <b>can update</b>
        &nbsp;the metadata&nbsp;<b>at any time</b> using this form (TODO: link)
        except <i>decimals</i> which cannot be changed after publishing.
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
}) {
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const { signAndExecuteTransactionBlock, isConnected, currentAccount } =
    useWalletKit();

  const handleClick = async () => {
    try {
      setError("");
      setOkMsg("");

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
      let [feeCoin] = tx.splitCoins({ kind: "GasCoin" }, [
        tx.pure(973000000), // 0.9 SUI
      ]);
      tx.transferObjects([feeCoin], tx.pure(FEE_ADDR));

      const { digest, objectChanges: maybeObjectChanges } =
        await signAndExecuteTransactionBlock({
          transactionBlock: tx,
        });

      // TODO: explorer link
      setOkMsg(`Transaction ok! Digest '${digest}'`);

      // TODO: reload list of currencies
      const objectChanges = maybeObjectChanges || [];
      objectChanges.find(
        (o) =>
          o.type === "created" &&
          o.objectType.startsWith("0x2::coin::CoinMetadata")
      );
      objectChanges.find(
        (o) =>
          o.type === "created" &&
          o.objectType.startsWith("0x2::coin::TreasuryCap")
      );
    } catch (error) {
      setError((error as Error).message);
    }
  };

  if (isConnected && currentAccount) {
    return (
      <div>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {okMsg && <p style={{ color: "green" }}>{okMsg}</p>}
        <button onClick={handleClick}>
          Ask wallet to create a new currency
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
