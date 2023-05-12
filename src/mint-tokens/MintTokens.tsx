import {
  ConnectButton,
  StandardWalletAdapter,
  useWalletKit,
} from "@mysten/wallet-kit";
import { TransactionBlock, formatAddress } from "@mysten/sui.js";
import { useState } from "react";
import { CHARGE_FEES, EXPLORER_URL, FEE_ADDR } from "../consts";
import Select from "react-select";
import { useSelector } from "react-redux";
import { State, RpcState, TreasuryCapMap } from "../store";

export function MintTokens() {
  const { isConnected, currentAccount } = useWalletKit();

  const selectOptions = useSelector<
    State,
    Array<{
      value: string;
      label: string;
    }>
  >((state) =>
    Object.entries(state.treasuryCap.value).map(
      ([treasury, { innerType }]) => ({
        value: treasury,
        label: `${formatAddress(innerType.address)}::${innerType.module}::${
          innerType.name
        }`,
      })
    )
  );

  const [selectedTreasury, setSelectedTreasury] = useState(
    "" as string | undefined
  );
  const [mintInfo, setMintInfo] = useState("");

  function appendSelfMint() {
    const maybeNewline =
      mintInfo.endsWith("\n") || mintInfo.length === 0 ? "" : "\n";
    setMintInfo(`${mintInfo}${maybeNewline}${currentAccount!.address}, 1`);
  }

  return (
    <div>
      <h2 id="mint-tokens">
        <img
          src="/img/detective-duck.64x64.png"
          width={32}
          alt="Detective duck logo"
        />
        &nbsp;&nbsp;Mint tokens
      </h2>

      <p>
        Select the currency for which you'd like to mint tokens. If you don't
        see your desired currency listed, ensure that you're logged in with the
        correct wallet and then click the refresh button below. TODO
      </p>

      <Select
        isClearable={true}
        required={true}
        onChange={(v) => setSelectedTreasury(v?.value)}
        placeholder="Select currency"
        options={selectOptions}
      />
      <br />

      <p>
        Each line must contain exactly one address followed by the amount of
        tokens to mint. <b>Decimals are ignored</b>; for example, inputting 100
        as the amount for a currency with 3 decimal places will display as 0.1
        in most wallets. In other words, if your currency was bitcoin, the input
        amount input would be in satoshis.
      </p>

      {isConnected && currentAccount ? (
        <p>
          <a onClick={() => appendSelfMint()}>Click here</a> to add an example
          with your address.
        </p>
      ) : (
        <></>
      )}

      <textarea
        value={mintInfo}
        onChange={(e) => setMintInfo(e.target.value)}
        placeholder="0x40343bad48a614d50e6eee21d53e065482c2abb85c47bdd2a5ce45e2445e2589, 1000&#10;0xa602a49d3ccbbae283f5e75e21b74e58b7cec3e39b56b14bc70c1325082e93e2, 80000&#10;..."
        id=""
        style={{ width: "100%" }}
        rows={10}
      ></textarea>

      <SendTransaction
        treasury={selectedTreasury}
        mintInfo={mintInfo}
        resetMintInfo={() => setMintInfo("")}
      ></SendTransaction>
    </div>
  );
}

function SendTransaction({
  treasury,
  mintInfo,
  resetMintInfo,
}: {
  treasury: string | undefined;
  mintInfo: string;
  resetMintInfo: () => void;
}) {
  const { signAndExecuteTransactionBlock, isConnected, currentAccount } =
    useWalletKit();

  const rpc = useSelector<State, RpcState>((state) => state.rpc);

  const treasuries = useSelector<State, TreasuryCapMap>(
    (state) => state.treasuryCap.value
  );

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState(<></>);
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConnected && currentAccount) {
    return (
      <div>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {okMsg}
        <button
          onClick={() =>
            mintTokensTx({
              setError,
              setOkMsg,
              setIsConfirming,
              signAndExecuteTransactionBlock,
              treasuries,
              rpc,
              mintInfo,
              treasury: treasury!,
              resetMintInfo,
            })
          }
          disabled={!treasury || isConfirming}
        >
          {isConfirming ? <>Confirming ...</> : <>Ask wallet to mint tokens</>}
        </button>
        as {formatAddress(currentAccount.address)}
      </div>
    );
  } else {
    return <ConnectButton connectText={"Connect wallet to mint tokens"} />;
  }
}

type MintTokensTxParams = {
  setError: (s: string) => void;
  setOkMsg: (s: JSX.Element) => void;
  setIsConfirming: (b: boolean) => void;
  signAndExecuteTransactionBlock: (input: {
    transactionBlock: TransactionBlock;
  }) => ReturnType<StandardWalletAdapter["signAndExecuteTransactionBlock"]>;
  treasuries: TreasuryCapMap;
  mintInfo: string;
  rpc: RpcState;
  treasury: string;
  resetMintInfo: () => void;
};

async function mintTokensTx({
  setError,
  setOkMsg,
  setIsConfirming,
  signAndExecuteTransactionBlock,
  treasuries,
  rpc,
  mintInfo,
  treasury,
  resetMintInfo,
}: MintTokensTxParams) {
  setError("");
  setOkMsg(<></>);
  setIsConfirming(true);

  try {
    // cannot be clicked if not treasury
    const innerType = treasuries[treasury].innerType;
    const innerTypeStr = `${innerType.address}::${innerType.module}::${innerType.name}`;

    const lines = mintInfo
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new Error("No instructions provided");
    }

    const tx = new TransactionBlock();

    lines.forEach((l, i) => {
      const parts = l.split(",");
      if (parts.length !== 2) {
        throw new Error(`Invalid format of line ${i + 1}`);
      }

      const recipient = parts[0].trim();
      const amount = parts[1].trim();
      if (!recipient.startsWith("0x")) {
        throw new Error(
          `Recipients must start with '0x', '${recipient}' does not`
        );
      }
      if (!amount || !amount.match(/^\d+$/)) {
        throw new Error(
          `Amount must be a positive integer, '${amount}' is not`
        );
      }

      tx.moveCall({
        arguments: [
          tx.object(treasury as string),
          tx.pure(amount, "u64"),
          tx.pure(recipient),
        ],
        typeArguments: [innerTypeStr],
        target: `0x2::coin::mint_and_transfer`,
      });
    });

    if (CHARGE_FEES) {
      let [feeCoin] = tx.splitCoins({ kind: "GasCoin" }, [
        tx.pure(500000000), // 0.5 SUI
      ]);
      tx.transferObjects([feeCoin], tx.pure(FEE_ADDR));
    }

    const { digest } = await signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });

    const digestUrl = `${EXPLORER_URL}/txblock/${digest}?network=${rpc.network}`;
    setOkMsg(
      <p style={{ color: "green" }}>
        Transaction ok! Digest&nbsp;
        <a target="_blank" href={digestUrl}>
          {digest}
        </a>
        &nbsp;(takes a few seconds to show in the explorer)
      </p>
    );

    resetMintInfo();
  } catch (error) {
    setError((error as Error).message);
  }

  setIsConfirming(false);
}
