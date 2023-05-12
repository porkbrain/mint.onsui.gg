import { configureStore } from "@reduxjs/toolkit";
import rpcReducer, { RpcState } from "./rpc";
import treasuryCapReducer, { TreasuryCapMap } from "./treasuryCap";
import coinMetadataReducer, { CoinMetadataMap } from "./coinMetadata";

export * from "./coinMetadata";
export * from "./rpc";
export * from "./treasuryCap";

export type State = {
  treasuryCap: {
    value: TreasuryCapMap;
    isLoaded: boolean;
  };
  rpc: RpcState;
  coinMetadata: {
    value: CoinMetadataMap;
  };
};

export default configureStore<State>({
  reducer: {
    treasuryCap: treasuryCapReducer,
    rpc: rpcReducer,
    coinMetadata: coinMetadataReducer,
  },
});
