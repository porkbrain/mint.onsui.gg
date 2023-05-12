import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import {
  ConnectButton,
  StandardWalletAdapter,
  useWalletKit,
} from "@mysten/wallet-kit";
import { Dispatch, useState } from "react";
import { TransactionBlock, formatAddress } from "@mysten/sui.js";
import {
  State,
  TreasuryCapMap,
  CoinMetadataMap,
  TreasuryCap,
  setCoinMetadata,
} from "../store";
import {
  CHARGE_FEES,
  DARK_THEME_STYLES,
  EXPLORER_URL,
  FEE_ADDR,
} from "../consts";
import { AnyAction } from "@reduxjs/toolkit";

export function UpdateMetadata() {
  const coinMetadata = useSelector<State, CoinMetadataMap>(
    (state) => state.coinMetadata.value
  );
  // user gets to decide which currency to update by the state in the store
  const selectOptions = useSelector<
    State,
    Array<{
      value: string;
      label: string;
    }>
  >((state) =>
    Object.entries(state.treasuryCap.value)
      // only show treasuries that HAVE metadata
      .filter(([treasuryAddr, _]) => !!coinMetadata[treasuryAddr])
      .map(([treasuryAddr, { innerType }]) => ({
        value: treasuryAddr,
        label: `${formatAddress(innerType.address)}::${innerType.module}::${
          innerType.name
        }`,
      }))
  );

  const [selectedTreasury, setSelectedTreasury] = useState(
    "" as string | undefined
  );
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  function resetForm() {
    setSymbol("");
    setName("");
    setDescription("");
    setIconUrl("");
  }

  function selectTreasury(addr: string | undefined) {
    // empty select == clean up
    if (!addr || !coinMetadata[addr]) {
      resetForm();
      return;
    }

    // populate the form with the current metadata
    const metadata = coinMetadata[addr];
    setSymbol(metadata.symbol || "");
    setName(metadata.name || "");
    setDescription(metadata.description || "");
    setIconUrl(metadata.iconUrl || "");

    // and set the selected treasury for the tx fn
    setSelectedTreasury(addr);
  }

  return (
    <div>
      <h2 id="update-metadata">
        <img
          src="/img/detective-duck.64x64.png"
          width={32}
          alt="Detective duck logo"
        />
        &nbsp;&nbsp;Update currency metadata
      </h2>

      <p>Once you set a currency's URL, it cannot be unset.</p>

      <p>You'll spend slightly less than 1 SUI on gas, storage, and fees.</p>

      <Select
        isClearable={true}
        required={true}
        onChange={(v) => selectTreasury(v?.value)}
        placeholder="Select currency"
        options={selectOptions}
        styles={DARK_THEME_STYLES}
      />
      <br />

      <div>
        <label htmlFor="token-symbol">Symbol:</label>&nbsp;&nbsp;
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
        iconUrl={iconUrl}
        description={description}
        selectedTreasury={selectedTreasury}
      ></SendTransaction>
    </div>
  );
}

type UpdateCurrency = {
  name: string;
  symbol: string;
  iconUrl: string;
  description: string;
};

function SendTransaction({
  selectedTreasury,
  name,
  symbol,
  iconUrl,
  description,
}: {
  selectedTreasury: string | undefined;
} & UpdateCurrency) {
  const { signAndExecuteTransactionBlock, isConnected, currentAccount } =
    useWalletKit();
  const dispatch = useDispatch();

  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState(<></>);

  const network = useSelector<State, string>((state) => state.rpc.network);
  const treasuries = useSelector<State, TreasuryCapMap>(
    (state) => state.treasuryCap.value
  );
  const coinMetadata = useSelector<State, CoinMetadataMap>(
    (state) => state.coinMetadata.value
  );

  if (!isConnected || !currentAccount) {
    return (
      <div>
        <br />
        <ConnectButton connectText={"Connect wallet to update metadata"} />
      </div>
    );
  }

  return (
    <div>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {okMsg}
      <button
        onClick={() =>
          updateMetadataTx({
            dispatch,
            setError,
            setOkMsg,
            setIsConfirming,
            signAndExecuteTransactionBlock,
            network,
            treasury: treasuries[selectedTreasury!],
            metadataAddr: coinMetadata[selectedTreasury!].addr,
            f: {
              name,
              symbol,
              iconUrl,
              description,
            },
          })
        }
        disabled={isConfirming || symbol.length < 2 || !selectedTreasury}
      >
        {isConfirming ? (
          <>Confirming ...</>
        ) : (
          <>Ask wallet to update metadata</>
        )}
      </button>
      as {formatAddress(currentAccount.address)}
    </div>
  );
}

type UpdateMetadataTxParams = {
  dispatch: Dispatch<AnyAction>;
  setError: (s: string) => void;
  setOkMsg: (s: JSX.Element) => void;
  setIsConfirming: (b: boolean) => void;
  signAndExecuteTransactionBlock: (input: {
    transactionBlock: TransactionBlock;
  }) => ReturnType<StandardWalletAdapter["signAndExecuteTransactionBlock"]>;
  network: string;
  treasury: TreasuryCap;
  metadataAddr: string;
  f: UpdateCurrency;
};

async function updateMetadataTx({
  dispatch,
  setError,
  setOkMsg,
  setIsConfirming,
  signAndExecuteTransactionBlock,
  network,
  treasury,
  metadataAddr,
  f,
}: UpdateMetadataTxParams) {
  setError("");
  setOkMsg(<></>);
  setIsConfirming(true);

  try {
    const tx = new TransactionBlock();

    const { address, module, name } = treasury.innerType;
    const typeArg = `${address}::${module}::${name}`;

    const fields = [
      {
        input: f.name,
        fn: "update_name",
      },
      {
        input: f.symbol,
        fn: "update_symbol",
      },
      {
        input: f.description,
        fn: "update_description",
      },
    ];

    if (f.iconUrl.length > 0) {
      // unfortunately, the icon url cannot be unset once set
      fields.push({
        input: f.iconUrl,
        fn: "update_icon_url",
      });
    }

    fields.forEach(({ input, fn }) => {
      tx.moveCall({
        arguments: [
          tx.object(treasury.addr),
          tx.object(metadataAddr),
          tx.pure(input),
        ],
        typeArguments: [typeArg],
        target: `0x2::coin::${fn}`,
      });
    });

    if (CHARGE_FEES) {
      let [feeCoin] = tx.splitCoins({ kind: "GasCoin" }, [
        tx.pure(970000000), // 0.97 SUI
      ]);
      tx.transferObjects([feeCoin], tx.pure(FEE_ADDR));
    }

    const { digest } = await signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });

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

    dispatch(
      setCoinMetadata({
        treasuryAddr: treasury.addr,
        metadata: {
          addr: metadataAddr,
          ...f,
        },
      })
    );
  } catch (error) {
    setError((error as Error).message);
  }

  setIsConfirming(false);
}
