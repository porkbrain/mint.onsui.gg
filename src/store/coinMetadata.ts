import { AnyAction, createSlice } from "@reduxjs/toolkit";
import { JsonRpcProvider } from "@mysten/sui.js";
import { Dispatch } from "react";
import { TreasuryCap } from "./treasuryCap";

export type CoinMetadata = {
  addr: string;
  symbol?: string;
  name?: string;
  description?: string;
  iconUrl?: string;
};

export type CoinMetadataMap = {
  [treasuryAddr: string]: CoinMetadata;
};

export type SetCoinMetadataAction = {
  payload: {
    treasuryAddr: string;
    metadata: CoinMetadata;
  };
};

export const coinMetadataCapSlice = createSlice({
  name: "treasuryCap",
  initialState: {
    value: {} as CoinMetadataMap,
  },
  reducers: {
    setCoinMetadata: (state, { payload }: SetCoinMetadataAction) => {
      state.value[payload.treasuryAddr] = payload.metadata;
    },
  },
});

export const { setCoinMetadata } = coinMetadataCapSlice.actions;

export default coinMetadataCapSlice.reducer;

export async function fetchCoinMetadata(
  dispatch: Dispatch<AnyAction>,
  sui: JsonRpcProvider,
  treasury: TreasuryCap
) {
  console.log("Fetching 0x2::coin::CoinMetadata for", treasury.addr);

  const { data } = await sui.queryTransactionBlocks({
    limit: 1,
    order: "ascending",
    filter: {
      ChangedObject: treasury.addr,
    },
    options: {
      showEffects: true,
    },
  });

  if (!data.length) {
    console.log("No initial tx found for", treasury.addr);
    return;
  }
  const createdAddrs = data[0].effects?.created?.map(
    (o) => o.reference.objectId
  );
  if (!createdAddrs) {
    console.log("No initial tx found for", treasury.addr);
    return;
  }

  const resp = await sui.multiGetObjects({
    ids: createdAddrs,
    options: { showType: true, showContent: true },
  });

  const metadata = resp
    .map((o) => o.data)
    .filter(Boolean)
    .find((o) =>
      o!.type!.includes(
        `:coin::CoinMetadata<${treasury.innerType.address}::${treasury.innerType.module}::${treasury.innerType.name}>`
      )
    );

  if (!metadata) {
    console.log("No metadata found for", treasury.addr);
    return;
  }

  if (metadata.content?.dataType !== "moveObject") {
    // unreachable
    return;
  }

  dispatch(
    setCoinMetadata({
      treasuryAddr: treasury.addr,
      metadata: {
        addr: metadata.objectId,
        description: metadata.content.fields["description"],
        iconUrl: metadata.content.fields["icon_url"],
        name: metadata.content.fields["name"],
        symbol: metadata.content.fields["symbol"],
      },
    })
  );
}
