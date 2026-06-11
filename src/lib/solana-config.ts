export const TOKEN_MINT = "Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump";
export const MIN_TOKEN_BALANCE = 1;
// Public mainnet RPC rate-limits; set VITE_RPC_ENDPOINT (Helius/QuickNode)
// in .env for production traffic.
// api.mainnet-beta.solana.com blocks browser traffic (403). Use a public,
// CORS-enabled endpoint by default; override with VITE_RPC_ENDPOINT for prod.
export const RPC_ENDPOINT =
  import.meta.env.VITE_RPC_ENDPOINT || "https://solana-rpc.publicnode.com";
export const PUMP_FUN_URL = `https://pump.fun/coin/${TOKEN_MINT}`;

export function shortAddress(addr?: string | null) {
  if (!addr) return "";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
