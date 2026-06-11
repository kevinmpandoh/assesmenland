export const TOKEN_MINT = "Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump";
export const MIN_TOKEN_BALANCE = 1;
export const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
export const PUMP_FUN_URL = `https://pump.fun/coin/${TOKEN_MINT}`;

export function shortAddress(addr?: string | null) {
  if (!addr) return "";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
