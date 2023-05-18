import { createSlice } from "@reduxjs/toolkit";
import { DEFAULT_FULLNODE, DEFAULT_NETWORK } from "../consts";
import { Connection, JsonRpcProvider } from "@mysten/sui.js";

export type RpcState = {
  fullnode: string;
  network: "mainnet" | "testnet" | "devnet";
};

export type SetNetworkAction = {
  payload: "mainnet" | "testnet" | "devnet";
};

export type SetFullNodeAction = {
  payload: string;
};

/**
 * Gets updated when the user selects a different RPC endpoint or network.
 * We use a hook in the App component to update the suiClient connection.
 */
export let suiClient = new JsonRpcProvider(
  new Connection({
    fullnode: DEFAULT_FULLNODE,
  })
);

export const suiClientSlice = createSlice({
  name: "suiClient",
  initialState: {
    fullnode: suiClient.connection.fullnode,
    network: DEFAULT_NETWORK,
  } as RpcState,
  reducers: {
    setNetwork: (state, { payload }: SetNetworkAction) => {
      state.network = payload;

      // update URL for page reloads/sharing
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("network", payload);
      window.history.pushState({}, "", currentUrl.toString());
    },
    setFullnode: (state, { payload }: SetFullNodeAction) => {
      state.fullnode = payload;
      suiClient = new JsonRpcProvider(
        new Connection({
          fullnode: payload,
        })
      );

      // update URL for page reloads/sharing
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("fullnode", payload);
      window.history.pushState({}, "", currentUrl.toString());
    },
  },
});

export const { setNetwork, setFullnode } = suiClientSlice.actions;

export default suiClientSlice.reducer;
