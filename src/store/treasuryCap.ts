import { AnyAction, createSlice } from "@reduxjs/toolkit";
import { JsonRpcProvider } from "@mysten/sui.js";
import { Dispatch } from "react";

export type TreasuryCap = {
  addr: string;
  innerType: {
    address: string;
    module: string;
    name: string;
  };
};

export type TreasuryCapMap = {
  [addr: string]: TreasuryCap;
};

type SetTreasuryCapAction = {
  payload: {
    cap: TreasuryCap;
  };
};

type SetRawTreasuryCapAction = {
  payload: {
    addr: string;
    objectType: string; // coin::TreasuryCap<T>
  };
};

export const treasuryCapSlice = createSlice({
  name: "treasuryCap",
  initialState: {
    value: {} as TreasuryCapMap,
  },
  reducers: {
    setTreasuryCap: (state, { payload }: SetTreasuryCapAction) => {
      state.value[payload.cap.addr] = payload.cap;
    },
    /**
     * Parses the object name for a generic argument.
     * Expected format of `objectType` is
     * - `0x2::coin::TreasuryCap<T>` or
     * - `000000...0002::coin::TreasuryCap<T>` or
     * - `0x000000...0002::coin::TreasuryCap<T>`
     */
    setRawTreasuryCap: (state, { payload }: SetRawTreasuryCapAction) => {
      const [address, module, name] = payload.objectType
        .slice(
          payload.objectType.indexOf("<") + 1,
          payload.objectType.length - 1
        )
        .split("::");
      state.value[payload.addr] = {
        addr: payload.addr,
        innerType: { address, module, name },
      };
    },
  },
});

export const { setTreasuryCap, setRawTreasuryCap } = treasuryCapSlice.actions;

export default treasuryCapSlice.reducer;

/**
 * Fetches all currencies for a given user.
 * With each fetched currency, dispatches a `setRawTreasuryCap` action.
 * Uses cursor to paginate through all currencies.
 */
export async function fetchAllTreasuryCaps(
  dispatch: Dispatch<AnyAction>,
  sui: JsonRpcProvider,
  addr: string
) {
  console.log("Fetching currencies for user", addr);

  let cursor;
  while (true) {
    const { data, hasNextPage, nextCursor } = await sui.getOwnedObjects({
      owner: addr,
      cursor,
      filter: {
        MoveModule: {
          package: "0x2",
          module: "coin",
        },
      },
      options: {
        showType: true,
      },
    });

    data
      .map((o) => o.data)
      .filter(Boolean)
      .filter((o) => o?.type?.includes("::coin::TreasuryCap<"))
      .map((o) => ({
        objectId: o!.objectId,
        objectType: o!.type!,
      }))
      .forEach(({ objectId, objectType }) => {
        dispatch(
          setRawTreasuryCap({
            addr: objectId,
            objectType,
          })
        );
      });

    if (!hasNextPage) {
      break;
    }
    cursor = nextCursor;
  }

  console.log("Done fetching currencies for user");
}
