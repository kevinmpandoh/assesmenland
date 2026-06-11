import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_MINT, MIN_TOKEN_BALANCE } from "@/lib/solana-config";

export type GateStatus = "idle" | "loading" | "granted" | "insufficient" | "error";

export function useTokenGate() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [status, setStatus] = useState<GateStatus>("idle");

  useEffect(() => {
    if (!connected || !publicKey) {
      setStatus("idle");
      setBalance(0);
      return;
    }
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        const mint = new PublicKey(TOKEN_MINT);
        const resp = await connection.getParsedTokenAccountsByOwner(publicKey, { mint });
        let total = 0;
        for (const acc of resp.value) {
          const info: any = acc.account.data.parsed.info;
          total += Number(info.tokenAmount?.uiAmount ?? 0);
        }
        if (cancelled) return;
        setBalance(total);
        setStatus(total >= MIN_TOKEN_BALANCE ? "granted" : "insufficient");
      } catch (e) {
        console.error("token gate error", e);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, publicKey, connection]);

  return { balance, status, address: publicKey?.toBase58() ?? null, connected };
}
