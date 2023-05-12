import { WalletKitProvider, useWalletKit } from "@mysten/wallet-kit";
import { Connection, formatAddress } from "@mysten/sui.js";
import store, {
  CoinMetadataMap,
  RpcState,
  State,
  TreasuryCapMap,
  fetchAllTreasuryCaps,
  fetchCoinMetadata,
  suiClient,
} from "./store";
import { Provider, useDispatch, useSelector } from "react-redux";
import { CreateNewCurrency } from "./create-new-currency/CreateNewCurrency";
import { MintTokens } from "./mint-tokens/MintTokens";
import { UpdateMetadata } from "./update-metadata/UpdateMetadata";
import { useEffect } from "react";

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
  const { isConnected, currentAccount } = useWalletKit();
  const dispatch = useDispatch();

  // when new network or RPC is selected, replace the connection
  const rpc = useSelector<State, RpcState>((state) => state.rpc);
  useEffect(() => {
    suiClient.connection = new Connection({ fullnode: rpc.fullnode });
  }, [rpc]);

  // fetch user treasury caps on load
  useEffect(() => {
    if (!isConnected || !currentAccount) return;
    // TODO: reset state
    fetchAllTreasuryCaps(dispatch, suiClient, currentAccount.address);
  }, [isConnected, currentAccount, rpc]);

  // fetch associated coin metadata for the treasuries
  const { isLoaded: areTresuriesLoaded, value: treasuries } = useSelector<
    State,
    {
      isLoaded: boolean;
      value: TreasuryCapMap;
    }
  >((state) => state.treasuryCap);
  useEffect(() => {
    if (!isConnected || !currentAccount) return;
    // TODO: reset state
    for (const treasury of Object.values(treasuries)) {
      fetchCoinMetadata(dispatch, suiClient, treasury);
    }
  }, [isConnected, currentAccount, rpc, areTresuriesLoaded]);

  return (
    <section>
      <h1>Coinnu | Sui currency management tool</h1>
      <i>coinnu at porkbrain dotcom</i>

      <CreateNewCurrency></CreateNewCurrency>
      <MintTokens></MintTokens>
      <UpdateMetadata></UpdateMetadata>

      <hr />
      <DisconnectWallet></DisconnectWallet>
    </section>
  );
}

function DisconnectWallet() {
  const { currentAccount, disconnect } = useWalletKit();
  if (currentAccount) {
    return (
      <div>
        <button onClick={disconnect}>
          Disconnect wallet <b>{formatAddress(currentAccount.address)}</b> from
          this website
        </button>
      </div>
    );
  } else {
    return <div></div>;
  }
}
