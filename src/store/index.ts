import { configureStore } from "@reduxjs/toolkit";
import treasuryCapReducer, { TreasuryCapMap } from "./treasuryCap";
import rpcReducer from "./rpc";
import { JsonRpcProvider } from "@mysten/sui.js";

export type State = {
  treasuryCap: {
    value: TreasuryCapMap;
  };
  rpc: {
    provider: JsonRpcProvider;
    network: string;
  };
};

export default configureStore<State>({
  reducer: {
    treasuryCap: treasuryCapReducer,
    rpc: rpcReducer,
  },
});
