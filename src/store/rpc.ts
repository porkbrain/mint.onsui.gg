import { createSlice } from "@reduxjs/toolkit";
import { DEFAULT_TESTNET_RPC_ENDPOINT } from "../consts";
import { Connection, JsonRpcProvider } from "@mysten/sui.js";

export type RpcState = {
  fullnode: string;
  network: "mainnet" | "testnet" | "devnet";
};

export type SetRpcStateAction = {
  payload: RpcState;
};

/**
 * Gets updated when the user selects a different RPC endpoint or network.
 * We use a hook in the App component to update the suiClient connection.
 */
export const suiClient = new JsonRpcProvider(
  new Connection({
    fullnode: DEFAULT_TESTNET_RPC_ENDPOINT,
  })
);

export const suiClientSlice = createSlice({
  name: "suiClient",
  initialState: {
    fullnode: suiClient.connection.fullnode,
    network: "testnet",
  } as RpcState,
  reducers: {
    changeRpc: (state, { payload }: SetRpcStateAction) => {
      state.fullnode = payload.fullnode;
      state.network = payload.network;
    },
  },
});

export const { changeRpc } = suiClientSlice.actions;

export default suiClientSlice.reducer;
