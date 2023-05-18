import { WalletKitProvider, useWalletKit } from "@mysten/wallet-kit";
import { formatAddress } from "@mysten/sui.js";
import store, {
  RpcState,
  State,
  setNetwork,
  fetchAllTreasuryCaps,
  fetchCoinMetadata,
  resetTreasuryCap,
  suiClient,
  setFullnode,
  TreasuryCapState,
} from "./store";
import { Provider, useDispatch, useSelector } from "react-redux";
import { CreateNewCurrency } from "./create-new-currency/CreateNewCurrency";
import { MintTokens } from "./mint-tokens/MintTokens";
import { UpdateMetadata } from "./update-metadata/UpdateMetadata";
import { useEffect, useState } from "react";
import {
  DEVNET_FULLNODE,
  FULLNODES,
  MAINNET_FULLNODE,
  TESTNET_FULLNODE,
} from "./consts";

export function App() {
  return (
    <Provider store={store}>
      <WalletKitProvider>
        <Section></Section>
      </WalletKitProvider>
    </Provider>
  );
}

function Section() {
  const { isConnected, currentAccount, disconnect } = useWalletKit();
  const dispatch = useDispatch();

  // when new network or RPC is selected, replace the connection
  const rpc = useSelector<State, RpcState>((state) => state.rpc);
  // fetch associated coin metadata for the treasuries
  const { loading: treasuriesLoading, value: treasuries } = useSelector<
    State,
    TreasuryCapState
  >((state) => state.treasuryCap);

  // fetch user treasury caps on load or change of rpc
  useEffect(() => {
    // network might have changed, so reset the state
    // also sets that treasuries are not loaded
    dispatch(resetTreasuryCap());
    if (!isConnected || !currentAccount || treasuriesLoading === "inProgress")
      return;
    fetchAllTreasuryCaps(dispatch, suiClient, currentAccount.address);
  }, [isConnected, currentAccount, rpc.fullnode]);

  useEffect(() => {
    if (!isConnected || !currentAccount || treasuriesLoading !== "done") return;
    const ts = Object.values(treasuries);
    // no need to reset the state here bcs the select is anyway oriented by
    // the treasury map
    for (const treasury of ts) {
      // to avoid making lots of requests at once, we create a delay based on
      // the number of treasuries
      new Promise((resolve) =>
        setTimeout(resolve, Math.min(Math.random() * 200 * ts.length, 5_000))
      ).then(() => fetchCoinMetadata(dispatch, suiClient, treasury));
    }
  }, [isConnected, currentAccount, treasuriesLoading]);

  return (
    <section>
      <h1>onsui.gg | Currency management tool</h1>
      <i>onsui at porkbrain dotcom</i>
      <hr />
      <Settings></Settings>
      <hr />

      <CreateNewCurrency></CreateNewCurrency>
      <MintTokens></MintTokens>
      <UpdateMetadata></UpdateMetadata>

      <hr />

      {currentAccount ? (
        <button onClick={disconnect}>
          Disconnect wallet <b>{formatAddress(currentAccount.address)}</b> from
          this website
        </button>
      ) : (
        <></>
      )}
    </section>
  );
}

function Settings() {
  const dispatch = useDispatch();
  const rpc = useSelector<State, RpcState>((state) => state.rpc);
  const areTreasuriesLoading = useSelector<State, boolean>(
    (state) => state.treasuryCap.loading === "inProgress"
  );

  const [newFullnode, setNewFullnode] = useState(rpc.fullnode);

  const isMainnet = rpc.network === "mainnet";
  const isTestnet = rpc.network === "testnet";
  const isDevnet = rpc.network === "devnet";
  const isCustomRpc =
    newFullnode !== MAINNET_FULLNODE &&
    newFullnode !== TESTNET_FULLNODE &&
    newFullnode !== DEVNET_FULLNODE;

  function networkClick(n: "mainnet" | "testnet" | "devnet") {
    if (isCustomRpc && newFullnode) {
      console.log("Using custom RPC URL with network", n);
      dispatch(setNetwork(n));
    } else {
      dispatch(setNetwork(n));
      dispatch(setFullnode(FULLNODES[n]));
      setNewFullnode(FULLNODES[n]);
    }
  }

  return (
    <div>
      <p>Match the network to your wallet.</p>
      <p>
        {isMainnet || areTreasuriesLoading ? (
          <b>Mainnet</b>
        ) : (
          <a onClick={() => networkClick("mainnet")}>Mainnet</a>
        )}
        &nbsp;|&nbsp;
        {isTestnet || areTreasuriesLoading ? (
          <b>Testnet</b>
        ) : (
          <a onClick={() => networkClick("testnet")}>Testnet</a>
        )}
        &nbsp;|&nbsp;
        {isDevnet || areTreasuriesLoading ? (
          <b>Devnet</b>
        ) : (
          <a onClick={() => networkClick("devnet")}>Devnet</a>
        )}
      </p>

      <p>
        <input
          type="text"
          style={{ width: "100%" }}
          value={newFullnode}
          onChange={(e) => setNewFullnode(e.target.value)}
        />

        {isCustomRpc && newFullnode ? (
          <button
            onClick={() => {
              setFullnode(newFullnode);
            }}
          >
            Use with {rpc.network}
          </button>
        ) : (
          <></>
        )}
      </p>
    </div>
  );
}
