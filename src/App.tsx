import { WalletKitProvider, useWalletKit } from "@mysten/wallet-kit";
import { formatAddress } from "@mysten/sui.js";
import { CreateNewCurrency } from "./create-new-currency/CreateNewCurrency";

export function App() {
  return (
    <section>
      <WalletKitProvider>
        <h1>Coinnu | Sui currency management tool</h1>

        <CreateNewCurrency></CreateNewCurrency>

        <hr />
        <DisconnectWallet></DisconnectWallet>
      </WalletKitProvider>
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
