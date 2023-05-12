import { WalletKitProvider, useWalletKit } from "@mysten/wallet-kit";
import { formatAddress } from "@mysten/sui.js";
import { CreateNewCurrency } from "./create-new-currency/CreateNewCurrency";
import { MintTokens } from "./mint-tokens/MintTokens";
import store from "./store";
import { Provider } from "react-redux";

export function App() {
  return (
    <section>
      <Provider store={store}>
        <WalletKitProvider>
          <h1>Coinnu | Sui currency management tool</h1>
          <i>coinnu at porkbrain dotcom</i>

          <CreateNewCurrency></CreateNewCurrency>
          <MintTokens></MintTokens>

          <hr />
          <DisconnectWallet></DisconnectWallet>
        </WalletKitProvider>
      </Provider>
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
