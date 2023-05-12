import { Connection, JsonRpcProvider } from "@mysten/sui.js";
import { createSlice } from "@reduxjs/toolkit";

type SetTreasuryCapAction = {
  payload: {
    fullnode: string;
    network: "mainnet" | "testnet" | "devnet";
  };
};

export const suiClientSlice = createSlice({
  name: "suiClient",
  initialState: {
    provider: new JsonRpcProvider(
      new Connection({
        fullnode: "https://sui-testnet-endpoint.blockvision.org",
      })
    ),
    network: "testnet",
  },
  reducers: {
    changeRpc: (state, { payload }: SetTreasuryCapAction) => {
      state.provider = new JsonRpcProvider(
        new Connection({
          fullnode: payload.fullnode,
        })
      );
      state.network = payload.network;
    },
  },
});

export const { changeRpc } = suiClientSlice.actions;

export default suiClientSlice.reducer;
