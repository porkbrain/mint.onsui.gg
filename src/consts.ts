export const FEE_ADDR =
  "0xf32fe294fd2ec01882374dafdf7feb1ff064bd8e0fa997d26602d072a001fe43";

export const CHARGE_FEES = false;

export const EXPLORER_URL = "https://suiexplorer.com";

export const DEFAULT_TESTNET_RPC_ENDPOINT =
  "https://sui-testnet-endpoint.blockvision.org";

/**
 * Restyles the default react-select theme to match the dark theme.
 */
export const DARK_THEME_STYLES = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "#3c3c3c",
    borderColor: "#5a5a5a",
    color: "white",
    boxShadow: "none",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#3c3c3c",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#5a5a5a"
      : state.isFocused
      ? "#4a4a4a"
      : "#3c3c3c",
    color: "white",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "white",
  }),
  input: (provided) => ({
    ...provided,
    color: "white",
  }),
};
